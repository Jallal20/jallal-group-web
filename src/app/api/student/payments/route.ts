import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentStudent } from "@/lib/student-auth";
import { uploadFile } from "@/lib/storage";
import {
  BackendNotConfiguredError,
  getCourseApplication,
  updateCourseApplicationPaymentStatus,
} from "@/lib/course-applications";
import { createCoursePayment } from "@/lib/course-payments";
import { createNotification } from "@/lib/notifications";
import { listAdminProfiles } from "@/lib/admin-profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireStudent() {
  const student = await getCurrentStudent();
  if (!student) {
    return NextResponse.json(
      { ok: false, code: "unauthenticated", message: "You must be logged in." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { student };
}

async function notifyAdminsOfPaymentSubmission(application: {
  reference: string;
  fullName: string;
  courseName: string;
  id: string;
}): Promise<void> {
  try {
    const admins = await listAdminProfiles({ limit: 100 });
    const link = `/admin/jallal-institute/payments`;
    await Promise.all(
      admins.items.map((a) =>
        createNotification({
          userId: a.adminId,
          title: "Payment evidence submitted",
          message: `${application.fullName} submitted payment evidence for "${application.courseName}" (Reference: ${application.reference}).`,
          type: "payment_submitted",
          link,
        }),
      ),
    );
  } catch {
    // Notification failures must not break the payment submission.
  }
}

export async function POST(request: Request) {
  const authorised = await requireStudent();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const student = authorised.student;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Expected multipart/form-data." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Unable to parse upload data." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const file = formData.get("receipt");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "No payment receipt provided." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim();
  const transactionReference = String(formData.get("transactionReference") ?? "").trim();
  const paymentDate = String(formData.get("paymentDate") ?? "").trim();
  const amountPaid = String(formData.get("amountPaid") ?? "").trim();

  if (!applicationId) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Application is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!paymentMethod) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Payment method is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!transactionReference) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Transaction reference is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!amountPaid || isNaN(parseFloat(amountPaid)) || parseFloat(amountPaid) <= 0) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Please enter a valid amount paid." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const application = await getCourseApplication(applicationId);
    if (!application) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Application not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (application.studentId && application.studentId !== student.id) {
      return NextResponse.json(
        { ok: false, code: "forbidden", message: "You cannot submit payment for this application." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const fee = parseFloat(amountPaid);

    const record = await uploadFile(file, {
      uploadedBy: student.id,
      allowImages: true,
      module: "course-payments",
      recordId: applicationId,
      action: "upload",
    });

    const payment = await createCoursePayment({
      applicationId: application.id,
      courseId: application.courseId,
      courseName: application.courseName,
      studentEmail: application.email,
      amount: fee,
      currency: application.currency,
      paymentMethod,
      transactionReference,
      paymentDate: paymentDate || null,
      receiptFileId: record.id,
      receiptFileName: record.name,
    });

    await updateCourseApplicationPaymentStatus(
      application.id,
      "submitted",
      record.id,
      record.name,
    );

    await notifyAdminsOfPaymentSubmission(application);

    return NextResponse.json(
      {
        ok: true,
        payment,
        message: "Your payment evidence has been submitted and is awaiting verification.",
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Payment service is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[student] payment submit failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: error instanceof Error ? error.message : "Payment submission failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
