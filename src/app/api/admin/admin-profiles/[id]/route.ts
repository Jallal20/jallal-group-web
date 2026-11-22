import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteAdminProfile,
  getAdminProfile,
  updateAdminProfile,
} from "@/lib/admin-profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "users.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage administrators." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const profile = await updateAdminProfile(id, {
      email: body.email !== undefined ? String(body.email).trim() : undefined,
      fullName: body.fullName !== undefined ? String(body.fullName).trim() : undefined,
      phone: body.phone !== undefined ? String(body.phone).trim() : undefined,
      assignedCompany: body.assignedCompany !== undefined ? String(body.assignedCompany).trim() : undefined,
      role: body.role !== undefined ? String(body.role).trim() : undefined,
      status: body.status !== undefined ? String(body.status).trim() : undefined,
      permissions: Array.isArray(body.permissions)
        ? body.permissions.filter((p): p is string => typeof p === "string")
        : undefined,
    }, admin);
    return NextResponse.json({ ok: true, profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] admin-profile update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update administrator." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { id } = await params;

  try {
    const existing = await getAdminProfile(id);
    if (!existing) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Administrator not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    await deleteAdminProfile(id, admin);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] admin-profile delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete administrator." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
