import { NextResponse } from "next/server";
import { z } from "zod";
import {
  BackendNotConfiguredError,
  createEnrollment,
} from "@/lib/enrollments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const enrollmentSchema = z.object({
  courseId: z.string().min(1, "Course is required."),
  courseName: z.string().min(1, "Course name is required."),
  fullName: z.string().trim().min(2, "Please enter your full name.").max(200),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z.string().trim().min(5, "Please enter a phone number.").max(50),
  whatsappNumber: z.string().trim().max(50).optional(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().trim().max(40).optional(),
  address: z.string().trim().min(5, "Please enter your address.").max(1000),
  educationBackground: z.string().trim().min(5, "Please describe your education background.").max(2000),
  relevantExperience: z.string().trim().max(2000).optional(),
  additionalInformation: z.string().trim().max(2000).optional(),
});

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

  const parsed = enrollmentSchema.safeParse(body);
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

  // Generate a unique reference
  const reference = `JG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  try {
    const enrollment = await createEnrollment({
      courseId: data.courseId,
      courseName: data.courseName,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber ?? "",
      dateOfBirth: data.dateOfBirth ?? null,
      gender: data.gender ?? "",
      address: data.address,
      educationBackground: data.educationBackground,
      relevantExperience: data.relevantExperience ?? "",
      additionalInformation: data.additionalInformation ?? "",
      reference,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Your enrollment has been received. We will review your application and respond shortly.",
        reference: enrollment.reference,
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Enrollment service is not configured on this deployment yet." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[public] enrollment create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "We could not record your enrollment right now. Please try again shortly." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
