import { NextResponse } from "next/server";
import { z } from "zod";
import {
  BackendNotConfiguredError,
  createCourseApplication,
  generateCourseApplicationReference,
  getCourseApplication,
} from "@/lib/course-applications";
import { getCourseBySlug } from "@/lib/courses";
import { createNotification } from "@/lib/notifications";
import { listAdminProfiles } from "@/lib/admin-profiles";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const applicationSchema = z.object({
  courseSlug: z.string().min(1, "Course is required."),
  fullName: z.string().trim().min(2, "Please enter your full name.").max(200),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z.string().trim().min(5, "Please enter a phone number.").max(50),
  whatsappNumber: z.string().trim().max(50).optional(),
  country: z.string().trim().max(120).optional(),
  district: z.string().trim().max(120).optional(),
  address: z.string().trim().min(5, "Please enter your residential address.").max(2000),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().trim().max(40).optional(),
  highestQualification: z.string().trim().max(200).optional(),
  institution: z.string().trim().max(200).optional(),
  occupation: z.string().trim().max(200).optional(),
  relevantExperience: z.string().trim().max(4000).optional(),
  deliveryPreference: z.string().trim().max(40).optional(),
  whyJoin: z.string().trim().min(5, "Please tell us why you want to join this course.").max(4000),
  relevantSkills: z.string().trim().max(4000).optional(),
  additionalInformation: z.string().trim().max(4000).optional(),
});

function zonedNow(): string {
  return new Date().toISOString();
}

async function notifyAdminsOfNewApplication(
  application: { reference: string; fullName: string; courseName: string; courseSlug: string; id: string },
): Promise<void> {
  try {
    const admins = await listAdminProfiles({ limit: 100 });
    const link = `/admin/jallal-institute/course-applications/${application.id}`;
    await Promise.all(
      admins.items.map((a) =>
        createNotification({
          userId: a.adminId,
          title: "New course application received",
          message: `${application.fullName} applied for "${application.courseName}" (Reference: ${application.reference}).`,
          type: "course_application",
          link,
        }),
      ),
    );
  } catch {
    // Notification failures must not break the application submission.
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return NextResponse.json(
      { ok: false, code: "validation", message: "Please correct the highlighted fields.", errors },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const data = parsed.data;

  try {
    const course = await getCourseBySlug(data.courseSlug);
    if (!course) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Course not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!course.published) {
      return NextResponse.json(
        { ok: false, code: "closed", message: "This course is not currently open for enrolment." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const now = new Date();

    if (course.enrollmentOpensAt && new Date(course.enrollmentOpensAt) > now) {
      return NextResponse.json(
        {
          ok: false,
          code: "not_open",
          message: `Enrolment opens on ${new Date(course.enrollmentOpensAt).toLocaleDateString("en-GB")}.`,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (course.enrollmentClosesAt && new Date(course.enrollmentClosesAt) < now) {
      return NextResponse.json(
        { ok: false, code: "closed", message: "Enrolment for this course has closed." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (course.capacity > 0) {
      // Count approved/confirmed applications for this course.
      const { listCourseApplications } = await import("@/lib/course-applications");
      const result = await listCourseApplications({
        courseId: course.id,
        limit: 1000,
      });
      const activeCount = result.items.filter(
        (a) =>
          a.status === "approved" ||
          a.status === "payment-submitted" ||
          a.status === "payment-verified" ||
          a.status === "enrollment-confirmed",
      ).length;
      if (activeCount >= course.capacity) {
        return NextResponse.json(
          { ok: false, code: "full", message: "This course is at full capacity." },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
    }

    // Prevent duplicate application from same email for same course.
    const { listCourseApplications } = await import("@/lib/course-applications");
    const existingByEmail = await listCourseApplications({
      courseId: course.id,
      limit: 1000,
    });
    if (
      existingByEmail.items.some((a) => a.email.toLowerCase() === data.email.toLowerCase())
    ) {
      return NextResponse.json(
        {
          ok: false,
          code: "duplicate",
          message: "An application for this course already exists with this email address.",
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const reference = await generateCourseApplicationReference();

    const application = await createCourseApplication({
      courseId: course.id,
      courseName: course.name,
      courseSlug: course.slug,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber,
      country: data.country,
      district: data.district,
      address: data.address,
      dateOfBirth: data.dateOfBirth ?? null,
      gender: data.gender,
      highestQualification: data.highestQualification,
      institution: data.institution,
      occupation: data.occupation,
      relevantExperience: data.relevantExperience,
      deliveryPreference: data.deliveryPreference,
      courseFee: course.fee,
      currency: course.currency,
      enrollmentDate: zonedNow(),
      whyJoin: data.whyJoin,
      relevantSkills: data.relevantSkills,
      additionalInformation: data.additionalInformation,
      reference,
    });

    await notifyAdminsOfNewApplication(application);

    return NextResponse.json(
      {
        ok: true,
        message:
          "Your enrolment application has been submitted successfully! It is awaiting administrative review.",
        reference: application.reference,
        id: application.id,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Application service is not configured on this deployment yet." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[public] course application create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "We could not record your application right now. Please try again shortly." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
