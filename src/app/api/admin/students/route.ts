import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createStudent,
  deleteStudent,
  getStudent,
  getStudentByStudentId,
  listStudents,
  setStudentStatus,
  updateStudent,
} from "@/lib/students";
import type { StudentStatus } from "@/lib/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: StudentStatus[] = ["active", "suspended", "inactive"];

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "students.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage students." },
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
  const status = STATUSES.includes(searchParams.get("status") as StudentStatus)
    ? (searchParams.get("status") as StudentStatus)
    : undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listStudents({ search: q, status, limit });
    return NextResponse.json({ ok: true, items: result.items, total: result.total });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] students list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Students could not be loaded." },
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

  const required = ["email", "fullName", "studentId"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "validation", message: `${field} is required.` },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  // Ensure unique studentId
  if (await getStudentByStudentId(String(body.studentId).trim())) {
    return NextResponse.json(
      { ok: false, code: "validation", message: `Student ID "${body.studentId}" already exists.` },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const student = await createStudent({
      userId: String(body.userId ?? "").trim(),
      studentId: String(body.studentId).trim(),
      email: String(body.email).trim(),
      fullName: String(body.fullName).trim(),
      phone: String(body.phone ?? "").trim(),
      dateOfBirth: body.dateOfBirth !== undefined ? (body.dateOfBirth as string | null) : null,
      gender: String(body.gender ?? "").trim(),
      address: String(body.address ?? "").trim(),
      institution: String(body.institution ?? "").trim(),
      educationalLevel: String(body.educationalLevel ?? "").trim(),
      courseOfStudy: String(body.courseOfStudy ?? "").trim(),
      status: STATUSES.includes((body.status as StudentStatus) ?? "active")
        ? (body.status as StudentStatus)
        : "active",
      emailVerified: body.emailVerified === true,
    }, admin);
    return NextResponse.json({ ok: true, student }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] student create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create student." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
