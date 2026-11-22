import { NextResponse } from "next/server";
import { hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteProject,
  getProject,
  updateProject,
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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) {
    return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Project not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, project }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] project get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Project could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) {
    return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  }
  const admin = authorised.admin;

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const input: Record<string, unknown> = {};
  const stringFields = [
    "title",
    "slug",
    "type",
    "category",
    "status",
    "companyId",
    "companyName",
    "description",
    "objectives",
    "coverImageId",
    "location",
    "registrationUrl",
    "activityId",
  ];
  for (const field of stringFields) {
    if (body[field] !== undefined) {
      input[field] = String(body[field] ?? "").trim();
    }
  }
  if (body.eventDate !== undefined) input.eventDate = body.eventDate ? String(body.eventDate) : null;
  if (body.endDate !== undefined) input.endDate = body.endDate ? String(body.endDate) : null;
  if (body.online !== undefined) input.online = body.online === true;
  if (body.registrationOpenAt !== undefined) {
    input.registrationOpenAt = body.registrationOpenAt ? String(body.registrationOpenAt) : null;
  }
  if (body.registrationCloseAt !== undefined) {
    input.registrationCloseAt = body.registrationCloseAt ? String(body.registrationCloseAt) : null;
  }
  if (body.progress !== undefined) input.progress = Number(body.progress ?? 0);
  if (body.featured !== undefined) input.featured = body.featured === true;
  if (body.displayOrder !== undefined) input.displayOrder = Number(body.displayOrder ?? 0);
  if (body.published !== undefined) input.published = body.published === true;
  if (body.publishedAt !== undefined) {
    input.publishedAt = body.publishedAt ? String(body.publishedAt) : null;
  }

  try {
    const project = await updateProject(id, input as never, admin);
    return NextResponse.json(
      { ok: true, project },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (message.includes("already exists")) {
      return NextResponse.json(
        { ok: false, code: "conflict", message },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] project update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Project could not be updated." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) {
    return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const project = await deleteProject(id, authorised.admin);
    return NextResponse.json(
      { ok: true, project },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] project delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Project could not be deleted." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
