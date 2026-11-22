import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentStudent } from "@/lib/student-auth";
import { createApplication, generateReference, getApplicationsByStudent } from "@/lib/applications";
import { getApplicationFormByActivity } from "@/lib/application-forms";
import { getActivity } from "@/lib/activities";
import { getStudentByUserId } from "@/lib/students";

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
    const applications = await getApplicationsByStudent(student.id);
    return NextResponse.json({ ok: true, items: applications }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[student] applications list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Applications could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const authorised = await requireStudent();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const student = authorised.student;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const activityId = String(body.activityId ?? "").trim();
  const formData = body.formData as Record<string, unknown> ?? {};
  const fileIds = Array.isArray(body.fileIds) ? body.fileIds as string[] : [];

  if (!activityId) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "activityId is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const activity = await getActivity(activityId);
    if (!activity) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Activity not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!activity.applicationsEnabled) {
      return NextResponse.json(
        { ok: false, code: "closed", message: "Applications are not enabled for this activity." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const form = await getApplicationFormByActivity(activityId);
    if (!form || form.status !== "open" || !form.published) {
      return NextResponse.json(
        { ok: false, code: "closed", message: "The application form is not currently open." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const reference = await generateReference(activityId);

    const application = await createApplication({
      activityId: activity.id,
      activityTitle: activity.title,
      studentId: student.id,
      studentName: student.fullName,
      studentEmail: student.email,
      reference,
      formData,
      fileIds,
    });

    return NextResponse.json({ ok: true, application }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[student] application create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to submit application." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
