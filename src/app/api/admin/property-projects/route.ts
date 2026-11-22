import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createPropertyProject,
  listPropertyProjects,
} from "@/lib/property-projects";
import type { ProjectStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ProjectStatus[] = ["planned", "in-development", "completed", "on-hold"];

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "propertyProjects.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage property projects." },
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
  const status = STATUSES.includes(searchParams.get("status") as ProjectStatus)
    ? (searchParams.get("status") as ProjectStatus)
    : undefined;
  const category = searchParams.get("category")?.trim() ?? undefined;
  const published = searchParams.get("published");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listPropertyProjects({
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
    console.error("[admin] property projects list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Property projects could not be loaded." },
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

  const required = ["name", "slug", "description", "location", "category", "status"];
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
    const project = await createPropertyProject(
      {
        name: String(body.name).trim(),
        slug: String(body.slug).trim(),
        description: String(body.description).trim(),
        location: String(body.location).trim(),
        category: String(body.category).trim(),
        status: body.status as ProjectStatus,
        imageIds: Array.isArray(body.imageIds) ? body.imageIds : [],
        highlights: Array.isArray(body.highlights) ? body.highlights : [],
        expectedLaunchDate:
          typeof body.expectedLaunchDate === "string"
            ? body.expectedLaunchDate
            : null,
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
    console.error("[admin] property project create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create property project." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
