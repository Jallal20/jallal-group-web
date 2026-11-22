import { NextResponse } from "next/server";
import { hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createProject,
  listProjects,
} from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "projects.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage projects." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

export async function GET(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) {
    return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? undefined;
  const type = searchParams.get("type")?.trim() ?? undefined;
  const category = searchParams.get("category")?.trim() ?? undefined;
  const published = searchParams.get("published");
  const featured = searchParams.get("featured");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listProjects({
      search: q || undefined,
      status: status || undefined,
      type: type || undefined,
      category: category || undefined,
      published: published === "true" ? true : published === "false" ? false : undefined,
      featured: featured === "true" ? true : featured === "false" ? false : undefined,
      limit,
    });
    return NextResponse.json(
      { ok: true, items: result.items, total: result.total },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] projects list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Projects could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) {
    return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  }
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

  const required = ["title", "slug", "category", "status"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "validation", message: `${field} is required.` },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  try {
    const project = await createProject(
      {
        title: String(body.title).trim(),
        slug: String(body.slug).trim(),
        type: String(body.type ?? "project").trim(),
        category: String(body.category).trim(),
        status: String(body.status).trim(),
        companyId: String(body.companyId ?? "").trim(),
        companyName: String(body.companyName ?? "").trim(),
        description: String(body.description ?? "").trim(),
        objectives: String(body.objectives ?? "").trim(),
        coverImageId: String(body.coverImageId ?? "").trim(),
        eventDate: body.eventDate ? String(body.eventDate) : null,
        endDate: body.endDate ? String(body.endDate) : null,
        location: String(body.location ?? "").trim(),
        online: body.online === true,
        registrationUrl: String(body.registrationUrl ?? "").trim(),
        registrationOpenAt: body.registrationOpenAt ? String(body.registrationOpenAt) : null,
        registrationCloseAt: body.registrationCloseAt ? String(body.registrationCloseAt) : null,
        progress: Number(body.progress ?? 0),
        featured: body.featured === true,
        displayOrder: Number(body.displayOrder ?? 0),
        published: body.published === true,
        publishedAt: body.publishedAt ? String(body.publishedAt) : null,
        activityId: String(body.activityId ?? "").trim(),
      },
      admin,
    );
    return NextResponse.json(
      { ok: true, project },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] project create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Project could not be created." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}