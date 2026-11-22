import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  getCoursePayment,
  rejectCoursePayment,
  verifyCoursePayment,
} from "@/lib/course-payments";
import {
  getCourseApplication,
  updateCourseApplicationPaymentStatus,
  updateCourseApplicationStatus,
} from "@/lib/course-applications";
import { createNotification } from "@/lib/notifications";
import type { PaymentStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "coursePayments.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to verify payments." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

async function notifyStudent(userId: string, title: string, message: string, link: string) {
  try {
    await createNotification({ userId, title, message, type: "payment", link });
  } catch {
    // Notification failures must not break the payment operation.
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;

  try {
    const payment = await getCoursePayment(id);
    if (!payment) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Payment record not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, payment });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] payment get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Payment could not be loaded." },
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

  let body: { action?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const payment = await getCoursePayment(id);
  if (!payment) {
    return NextResponse.json(
      { ok: false, code: "not_found", message: "Payment record not found." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const application = await getCourseApplication(payment.applicationId);

  try {
    if (body.action === "verify") {
      const updated = await verifyCoursePayment(id, admin);

      // Mark the application's payment as verified.
      if (application) {
        await updateCourseApplicationPaymentStatus(
          application.id,
          "verified",
        );
        await updateCourseApplicationStatus(
          application.id,
          "payment-verified",
          `Payment verified by ${admin.email}.`,
          admin,
        );

        // Confirm enrolment when all conditions are satisfied.
        const course = await import("@/lib/courses").then((m) =>
          m.getCourse(payment.courseId).catch(() => null),
        );
        const confirmedCount = await import("@/lib/course-applications").then((m) =>
          m.listCourseApplications({ courseId: payment.courseId, limit: 1000 }).then((r) =>
            r.items.filter(
              (a) => a.status === "enrollment-confirmed",
            ).length,
          ),
        );
        const capacityOK =
          !course || course.capacity === 0 || confirmedCount < course.capacity;
        const isFree = Boolean(course?.isFree);

        // Payment status was just set to "verified" above.
        if (isFree || capacityOK) {
          await updateCourseApplicationStatus(
            application.id,
            "enrollment-confirmed",
            "Enrolment confirmed after payment verification.",
            admin,
          );
        }

        await notifyStudent(
          application.studentUserId || application.studentId,
          "Payment verified — enrolment confirmed",
          `Your payment for "${payment.courseName}" has been verified and your enrolment is confirmed.`,
          `/student/course-applications/${application.id}`,
        );
      }

      return NextResponse.json({ ok: true, payment: updated });
    }

    if (body.action === "reject") {
      if (!body.reason || String(body.reason).trim() === "") {
        return NextResponse.json(
          { ok: false, code: "validation", message: "A rejection reason is required." },
          { status: 422, headers: { "Cache-Control": "no-store" } },
        );
      }
      const updated = await rejectCoursePayment(id, admin, String(body.reason).trim());

      if (application) {
        await updateCourseApplicationPaymentStatus(application.id, "rejected");
        await notifyStudent(
          application.studentUserId || application.studentId,
          "Payment evidence rejected",
          `The payment evidence you submitted for "${payment.courseName}" was rejected. Reason: ${body.reason}. You may submit corrected evidence.`,
          `/student/course-applications/${application.id}`,
        );
      }

      return NextResponse.json({ ok: true, payment: updated });
    }

    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid action. Use 'verify' or 'reject'." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] payment update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update payment." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
