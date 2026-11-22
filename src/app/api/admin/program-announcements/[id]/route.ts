import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteProgramAnnouncement,
  getProgramAnnouncement,
  updateProgramAnnouncement,
} from "@/lib/program-announcements";
import type { AnnouncementAudience } from "@/lib/program-announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUDIENCES: AnnouncementAudience[] = ["all", "program", "approved", "applicants", "individual"];

type Params = { id: string };

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "programs.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage programs." },
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
    const announcement = await getProgramAnnouncement(id);
    if (!announcement) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Announcement not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, announcement });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] announcement get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Announcement could not be loaded." },
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

  if (body.audience !== undefined && !AUDIENCES.includes(body.audience as AnnouncementAudience)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid audience." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const announcement = await updateProgramAnnouncement(id, {
      activityId: body.activityId !== undefined ? (body.activityId as string | null) : undefined,
      activityTitle: body.activityTitle !== undefined ? String(body.activityTitle).trim() : undefined,
      audience: body.audience as AnnouncementAudience | undefined,
      targetStudentIds: body.targetStudentIds !== undefined ? (Array.isArray(body.targetStudentIds) ? body.targetStudentIds : []) : undefined,
      title: body.title !== undefined ? String(body.title).trim() : undefined,
      message: body.message !== undefined ? String(body.message).trim() : undefined,
      fileId: body.fileId !== undefined ? String(body.fileId).trim() : undefined,
      fileName: body.fileName !== undefined ? String(body.fileName).trim() : undefined,
      publishAt: body.publishAt !== undefined ? (body.publishAt as string | null) : undefined,
      published: body.published !== undefined ? body.published === true : undefined,
    }, admin);
    return NextResponse.json({ ok: true, announcement });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] announcement update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update announcement." },
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
    await deleteProgramAnnouncement(id, admin);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] announcement delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete announcement." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
