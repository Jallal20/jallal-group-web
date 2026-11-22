import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  getCourseApplication,
  updateCourseApplicationStatus,
  deleteCourseApplication,
} from "@/lib/course-applications";
import { createStatusHistoryEntry } from "@/lib/application-status-history";
import { createNotification } from "@/lib/notifications";
import type { CourseApplicationStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: CourseApplicationStatus[] = [
  "pending-review",
  "under-review",
  "approved",
  "rejected",
  "awaiting-payment",
  "payment-submitted",
  "payment-verified",
  "enrollment-confirmed",
];

type Params = { id: string };

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "courseApplications.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage course applications." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

async function notifyStudent(userId: string, title: string, message: string, link: string) {
  try {
    await createNotification({ userId, title, message, type: "course_application", link });
  } catch {
    // Notification failures must not break the application operation.
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { id } = await params;

  try {
    const application = await getCourseApplication(id);
    if (!application) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Course application not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, application, admin });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] course application get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Course application could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { id } = await params;

  let body: { status?: string; adminNotes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!body.status || !STATUSES.includes(body.status as CourseApplicationStatus)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid application status." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const application = await updateCourseApplicationStatus(
      id,
      body.status as CourseApplicationStatus,
      body.adminNotes ?? "",
      admin,
    );

    await createStatusHistoryEntry({
      applicationId: id,
      status: body.status as CourseApplicationStatus,
      changedBy: admin.id,
      changedByEmail: admin.email,
      changedByRole: admin.isSuperAdmin ? "Super Admin" : "Sub-Admin",
      notes: body.adminNotes ?? "",
    });

    const userId = application.studentUserId || application.studentId;
    const link = `/student/course-applications/${application.id}`;

    if (body.status === "approved") {
      await notifyStudent(
        userId,
        "Application approved",
        `Your application for "${application.courseName}" has been approved.${
          application.courseFee === 0 ? " Your enrolment will be confirmed by the admissions team." : " Payment is now required."
        }`,
        link,
      );
    } else if (body.status === "rejected") {
      await notifyStudent(
        userId,
        "Application decision",
        `Your application for "${application.courseName}" was not approved.`,
        link,
      );
    } else if (body.status === "awaiting-payment") {
      await notifyStudent(
        userId,
        "Payment required",
        `Your application for "${application.courseName}" has been approved. Please proceed to your dashboard to submit payment evidence.`,
        link,
      );
    } else if (body.status === "enrollment-confirmed") {
      await notifyStudent(
        userId,
        "Enrolment confirmed",
        `Your enrolment in "${application.courseName}" is confirmed.`,
        link,
      );
    }

    return NextResponse.json({ ok: true, application }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] course application update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update course application." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { id } = await params;

  try {
    await deleteCourseApplication(id, admin);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] course application delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete course application." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
