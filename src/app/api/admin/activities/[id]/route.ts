import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteActivity,
  getActivity,
  updateActivity,
} from "@/lib/activities";
import type { ActivityStatus } from "@/lib/activities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ActivityStatus[] = ["draft", "scheduled", "published", "archived"];

type Params = { id: string };

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "activities.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage activities." },
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
    const activity = await getActivity(id);
    if (!activity) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Activity not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] activity get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Activity could not be loaded." },
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

  if (body.status && !STATUSES.includes(body.status as ActivityStatus)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid activity status." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const activity = await updateActivity(id, {
      title: body.title !== undefined ? String(body.title).trim() : undefined,
      slug: body.slug !== undefined ? String(body.slug).trim() : undefined,
      category: body.category !== undefined ? String(body.category).trim() : undefined,
      description: body.description !== undefined ? String(body.description).trim() : undefined,
      objectives: body.objectives !== undefined ? String(body.objectives).trim() : undefined,
      eligibility: body.eligibility !== undefined ? String(body.eligibility).trim() : undefined,
      venue: body.venue !== undefined ? String(body.venue).trim() : undefined,
      venueType: body.venueType !== undefined ? (body.venueType as any) : undefined,
      startDate: body.startDate !== undefined ? (body.startDate as string | null) : undefined,
      endDate: body.endDate !== undefined ? (body.endDate as string | null) : undefined,
      startTime: body.startTime !== undefined ? String(body.startTime).trim() : undefined,
      endTime: body.endTime !== undefined ? String(body.endTime).trim() : undefined,
      duration: body.duration !== undefined ? String(body.duration).trim() : undefined,
      applicationOpensAt: body.applicationOpensAt !== undefined ? (body.applicationOpensAt as string | null) : undefined,
      applicationDeadline: body.applicationDeadline !== undefined ? (body.applicationDeadline as string | null) : undefined,
      totalSlots: body.totalSlots !== undefined ? parseInt(String(body.totalSlots), 10) || 0 : undefined,
      fee: body.fee !== undefined ? parseInt(String(body.fee), 10) || 0 : undefined,
      currency: body.currency !== undefined ? String(body.currency).trim() : undefined,
      isFree: body.isFree !== undefined ? body.isFree === true : undefined,
      applicationsEnabled: body.applicationsEnabled !== undefined ? body.applicationsEnabled === true : undefined,
      posterImageId: body.posterImageId !== undefined ? String(body.posterImageId).trim() : undefined,
      imageIds: body.imageIds !== undefined ? (Array.isArray(body.imageIds) ? body.imageIds : []) : undefined,
      organizer: body.organizer !== undefined ? String(body.organizer).trim() : undefined,
      status: body.status as ActivityStatus | undefined,
      publishAt: body.publishAt !== undefined ? (body.publishAt as string | null) : undefined,
      published: body.published !== undefined ? body.published === true : undefined,
    }, admin);
    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] activity update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update activity." },
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
    await deleteActivity(id, admin);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] activity delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete activity." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
