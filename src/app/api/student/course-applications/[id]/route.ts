import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/student-auth";
import {
  BackendNotConfiguredError,
  getCourseApplication,
} from "@/lib/course-applications";
import { getCoursePaymentByApplication } from "@/lib/course-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const authorised = await requireStudent();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const student = authorised.student;

  const { id } = await params;

  try {
    const application = await getCourseApplication(id);
    if (!application) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Application not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (application.studentId && application.studentId !== student.id) {
      return NextResponse.json(
        { ok: false, code: "forbidden", message: "You cannot view this application." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const payment = await getCoursePaymentByApplication(id);

    return NextResponse.json({ ok: true, application, payment }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Application service is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[student] course application get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Application could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
