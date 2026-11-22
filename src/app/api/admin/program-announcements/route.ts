import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createProgramAnnouncement,
  deleteProgramAnnouncement,
  getProgramAnnouncement,
  listProgramAnnouncements,
  updateProgramAnnouncement,
} from "@/lib/program-announcements";
import type { AnnouncementAudience } from "@/lib/program-announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUDIENCES: AnnouncementAudience[] = ["all", "program", "approved", "applicants", "individual"];

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

export async function GET(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  try {
    const items = await listProgramAnnouncements();
    return NextResponse.json({ ok: true, items, total: items.length });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] announcements list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Announcements could not be loaded." },
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

  if (!body.title || String(body.title).trim() === "") {
    return NextResponse.json(
      { ok: false, code: "validation", message: "title is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!AUDIENCES.includes((body.audience as AnnouncementAudience) ?? "all")) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid audience." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const announcement = await createProgramAnnouncement(
      {
        activityId: body.activityId !== undefined ? (body.activityId as string | null) : null,
        activityTitle: String(body.activityTitle ?? "").trim(),
        audience: body.audience as AnnouncementAudience,
        targetStudentIds: Array.isArray(body.targetStudentIds) ? body.targetStudentIds : [],
        title: String(body.title).trim(),
        message: String(body.message ?? "").trim(),
        fileId: String(body.fileId ?? "").trim(),
        fileName: String(body.fileName ?? "").trim(),
        publishAt: body.publishAt !== undefined ? (body.publishAt as string | null) : null,
        published: body.published === true,
      },
      admin,
    );
    return NextResponse.json({ ok: true, announcement }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] announcement create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create announcement." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
