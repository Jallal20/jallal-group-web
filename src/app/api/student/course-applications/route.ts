import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/student-auth";
import {
  BackendNotConfiguredError,
  getCourseApplication,
  getCourseApplicationsByStudent,
} from "@/lib/course-applications";
import { getCoursePaymentByApplication } from "@/lib/course-payments";

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

export async function GET(request: Request) {
  const authorised = await requireStudent();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const student = authorised.student;

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("course")?.trim() || undefined;

  try {
    const applications = await getCourseApplicationsByStudent(student.id);
    const items = courseId
      ? applications.filter((a) => a.courseId === courseId)
      : applications;
    return NextResponse.json({ ok: true, items }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Application service is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[student] course applications list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Applications could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
