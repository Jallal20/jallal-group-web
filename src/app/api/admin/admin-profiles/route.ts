import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createAdminProfile,
  deleteAdminProfile,
  getAdminProfile,
  listAdminProfiles,
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

export async function GET(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? undefined;
  const role = searchParams.get("role")?.trim() ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listAdminProfiles({ search: q, status, role, limit });
    return NextResponse.json({ ok: true, items: result.items, total: result.total });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] admin-profiles list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Administrators could not be loaded." },
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

  const required = ["adminId", "email", "fullName", "role", "status"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "validation", message: `${field} is required.` },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  try {
    const result = await createAdminProfile(
      {
        adminId: String(body.adminId).trim(),
        email: String(body.email).trim(),
        fullName: String(body.fullName).trim(),
        phone: String(body.phone ?? "").trim(),
        assignedCompany: String(body.assignedCompany ?? "").trim(),
        role: String(body.role).trim(),
        status: String(body.status).trim(),
        permissions: Array.isArray(body.permissions) ? body.permissions : [],
        createdBy: admin.id,
        ...(typeof body.password === "string" && body.password.trim() !== ""
          ? { password: body.password.trim() }
          : {}),
      },
      admin,
    );
    return NextResponse.json(
      { ok: true, profile: result, temporaryPassword: result.temporaryPassword },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] admin-profile create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create administrator." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
