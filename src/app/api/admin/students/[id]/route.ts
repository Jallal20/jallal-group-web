import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteStudent,
  getStudent,
  setStudentStatus,
  updateStudent,
} from "@/lib/students";
import type { StudentStatus } from "@/lib/students";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: StudentStatus[] = ["active", "suspended", "inactive"];

type Params = { id: string };

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

export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;

  try {
    const student = await getStudent(id);
    if (!student) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Student not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, student });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] student get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Student could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<Params> }) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { id } = await params;

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
    const student = await updateStudent(id, {
      email: body.email !== undefined ? String(body.email).trim() : undefined,
      fullName: body.fullName !== undefined ? String(body.fullName).trim() : undefined,
      phone: body.phone !== undefined ? String(body.phone).trim() : undefined,
      dateOfBirth: body.dateOfBirth !== undefined ? (body.dateOfBirth as string | null) : undefined,
      gender: body.gender !== undefined ? String(body.gender).trim() : undefined,
      address: body.address !== undefined ? String(body.address).trim() : undefined,
      institution: body.institution !== undefined ? String(body.institution).trim() : undefined,
      educationalLevel: body.educationalLevel !== undefined ? String(body.educationalLevel).trim() : undefined,
      courseOfStudy: body.courseOfStudy !== undefined ? String(body.courseOfStudy).trim() : undefined,
      status: body.status as StudentStatus | undefined,
      emailVerified: body.emailVerified !== undefined ? body.emailVerified === true : undefined,
    }, admin);
    return NextResponse.json({ ok: true, student });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] student update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update student." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<Params> }) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { id } = await params;

  try {
    await deleteStudent(id, admin);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] student delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete student." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
