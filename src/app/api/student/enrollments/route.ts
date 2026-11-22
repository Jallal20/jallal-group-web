import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/student-auth";
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

export async function GET() {
  const authorised = await requireStudent();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const student = authorised.student;

  try {
    const enrollments = await getEnrollmentsByStudent(student.id);
    return NextResponse.json({ ok: true, items: enrollments }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[student] enrollments list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Enrollments could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
