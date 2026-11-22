import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createProgramEnrollment,
  deleteProgramEnrollment,
  getProgramEnrollment,
  listProgramEnrollments,
  updateProgramEnrollment,
} from "@/lib/program-enrollments";
import type { EnrollmentStatus } from "@/lib/program-enrollments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: EnrollmentStatus[] = ["pending", "active", "completed", "suspended", "withdrawn"];

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "programs.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage program enrollments." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

export async function GET(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = STATUSES.includes(searchParams.get("status") as EnrollmentStatus)
    ? (searchParams.get("status") as EnrollmentStatus)
    : undefined;
  const activityId = searchParams.get("activityId")?.trim() ?? undefined;
  const studentId = searchParams.get("studentId")?.trim() ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listProgramEnrollments({ search: q, status, activityId, studentId, limit });
    return NextResponse.json({ ok: true, items: result.items, total: result.total });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] program enrollments list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Program enrollments could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const required = ["studentId", "studentName", "studentEmail", "activityId", "activityTitle", "status"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "validation", message: `${field} is required.` },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  if (!STATUSES.includes(body.status as EnrollmentStatus)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid enrollment status." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const enrollment = await createProgramEnrollment(
      {
        studentId: String(body.studentId).trim(),
        studentName: String(body.studentName).trim(),
        studentEmail: String(body.studentEmail).trim(),
        activityId: String(body.activityId).trim(),
        activityTitle: String(body.activityTitle).trim(),
        applicationId: body.applicationId !== undefined ? String(body.applicationId) : null,
        schedule: String(body.schedule ?? "").trim(),
        instructor: String(body.instructor ?? "").trim(),
        notes: String(body.notes ?? "").trim(),
        status: body.status as EnrollmentStatus,
      },
      admin,
    );
    return NextResponse.json({ ok: true, enrollment }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] program enrollment create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create program enrollment." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PUT(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "id query parameter is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const enrollment = await updateProgramEnrollment(id, {
      studentName: body.studentName !== undefined ? String(body.studentName).trim() : undefined,
      studentEmail: body.studentEmail !== undefined ? String(body.studentEmail).trim() : undefined,
      schedule: body.schedule !== undefined ? String(body.schedule).trim() : undefined,
      instructor: body.instructor !== undefined ? String(body.instructor).trim() : undefined,
      notes: body.notes !== undefined ? String(body.notes).trim() : undefined,
      status: body.status as EnrollmentStatus | undefined,
    }, admin);
    return NextResponse.json({ ok: true, enrollment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] program enrollment update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update program enrollment." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "id query parameter is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await deleteProgramEnrollment(id, admin);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] program enrollment delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete program enrollment." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
