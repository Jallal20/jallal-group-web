import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/student-auth";
import { getApplication } from "@/lib/applications";
import { getEnrollmentsByStudent } from "@/lib/program-enrollments";

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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorised = await requireStudent();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const student = authorised.student;

  const { id } = await params;

  try {
    const application = await getApplication(id);
    if (!application) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Application not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (application.studentId !== student.id) {
      return NextResponse.json(
        { ok: false, code: "forbidden", message: "You cannot view this application." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json({ ok: true, application }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[student] application get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Application could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
