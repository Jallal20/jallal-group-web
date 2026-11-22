import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/student-auth";
import { getAnnouncementsForStudent } from "@/lib/program-announcements";
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

export async function GET(request: Request) {
  const authorised = await requireStudent();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const student = authorised.student;

  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get("activityId")?.trim() || undefined;

  try {
    const announcements = await getAnnouncementsForStudent(student.id, activityId);
    return NextResponse.json({ ok: true, items: announcements }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[student] announcements list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Announcements could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
