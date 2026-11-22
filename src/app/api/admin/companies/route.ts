import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createCompany,
  deleteCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "@/lib/companies-management";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "companies.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage companies." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

export async function GET(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 200);

  try {
    const result = await listCompanies({ search: q, limit });
    return NextResponse.json({ ok: true, items: result.items, total: result.total });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] companies list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Companies could not be loaded." },
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

  if (!body.slug || String(body.slug).trim() === "") {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Slug is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!body.name || String(body.name).trim() === "") {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Name is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const company = await createCompany(
      {
        slug: String(body.slug).trim(),
        name: String(body.name).trim(),
        order: body.order !== undefined ? parseInt(String(body.order), 10) || 0 : 0,
        payload: (typeof body.payload === "object" && body.payload !== null
          ? body.payload
          : {}) as Record<string, unknown>,
      },
      admin,
    );
    return NextResponse.json({ ok: true, company }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] company create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create company." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PUT(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "id is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
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
    const company = await updateCompany(
      id,
      {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.slug !== undefined && { slug: String(body.slug).trim() }),
        ...(body.order !== undefined && { order: parseInt(String(body.order), 10) }),
        ...(body.payload !== undefined && {
          payload: body.payload as Record<string, unknown>,
        }),
      },
      admin,
    );
    return NextResponse.json({ ok: true, company }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] company update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update company." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "id is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await deleteCompany(id, admin);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] company delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete company." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
