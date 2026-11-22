import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createDigitalVenture,
  listDigitalVentures,
} from "@/lib/digital-ventures";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "content.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage digital ventures." },
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
  const category = searchParams.get("category")?.trim() ?? undefined;
  const published = searchParams.get("published");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listDigitalVentures({
      search: q,
      status,
      category,
      published: published === "true" ? true : published === "false" ? false : undefined,
      limit,
    });
    return NextResponse.json({ ok: true, items: result.items, total: result.total });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] digital-ventures list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Digital ventures could not be loaded." },
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

  const required = ["name", "slug", "description", "category", "status"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "validation", message: `${field} is required.` },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  try {
    const venture = await createDigitalVenture(
      {
        name: String(body.name).trim(),
        slug: String(body.slug).trim(),
        description: String(body.description).trim(),
        category: String(body.category).trim(),
        status: String(body.status).trim(),
        imageIds: Array.isArray(body.imageIds) ? body.imageIds : [],
        websiteUrl: String(body.websiteUrl ?? "").trim(),
        featured: body.featured === true,
        published: body.published === true,
      },
      admin,
    );
    return NextResponse.json({ ok: true, venture }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] digital-venture create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create digital venture." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
