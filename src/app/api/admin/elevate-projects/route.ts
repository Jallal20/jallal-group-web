import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "@/lib/elevate-projects";
import type { ProjectStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ProjectStatus[] = ["planned", "in-development", "completed", "on-hold"];

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "elevateProjects.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage Elevate 360 projects." },
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
  const status = STATUSES.includes(searchParams.get("status") as ProjectStatus)
    ? (searchParams.get("status") as ProjectStatus)
    : undefined;
  const category = searchParams.get("category")?.trim() ?? undefined;
  const published = searchParams.get("published");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "100", 10), 200);

  try {
    const result = await listProjects({
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
    console.error("[admin] elevate-projects list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Elevate 360 projects could not be loaded." },
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

  if (!STATUSES.includes(body.status as ProjectStatus)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid project status." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const project = await createProject(
      {
        name: String(body.name).trim(),
        slug: String(body.slug).trim(),
        description: String(body.description).trim(),
        objectives: String(body.objectives ?? "").trim(),
        category: String(body.category).trim(),
        imageIds: Array.isArray(body.imageIds) ? body.imageIds : [],
        status: body.status as ProjectStatus,
        launchDate: (body.launchDate as string | null) ?? null,
        participationInfo: String(body.participationInfo ?? "").trim(),
        featured: body.featured === true,
        published: body.published === true,
      },
      admin,
    );
    return NextResponse.json({ ok: true, project }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] elevate-project create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create Elevate 360 project." },
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
    const project = await updateProject(
      id,
      {
        ...(body.name !== undefined && { name: String(body.name).trim() }),
        ...(body.slug !== undefined && { slug: String(body.slug).trim() }),
        ...(body.description !== undefined && { description: String(body.description).trim() }),
        ...(body.objectives !== undefined && { objectives: String(body.objectives).trim() }),
        ...(body.category !== undefined && { category: String(body.category).trim() }),
        ...(body.imageIds !== undefined && {
          imageIds: Array.isArray(body.imageIds) ? body.imageIds : [],
        }),
        ...(body.status !== undefined && { status: body.status as ProjectStatus }),
        ...(body.launchDate !== undefined && {
          launchDate: (body.launchDate as string | null) ?? null,
        }),
        ...(body.participationInfo !== undefined && { participationInfo: String(body.participationInfo).trim() }),
        ...(body.featured !== undefined && { featured: body.featured === true }),
        ...(body.published !== undefined && { published: body.published === true }),
      },
      admin,
    );
    return NextResponse.json({ ok: true, project }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] elevate-project update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update Elevate 360 project." },
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
    await deleteProject(id, admin);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] elevate-project delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete Elevate 360 project." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
