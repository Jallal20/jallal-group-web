import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createActivity,
  deleteActivity,
  listActivities,
  updateActivity,
} from "@/lib/activities";
import type { ActivityStatus } from "@/lib/activities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ActivityStatus[] = ["draft", "scheduled", "published", "archived"];

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

export async function GET(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = STATUSES.includes(searchParams.get("status") as ActivityStatus)
    ? (searchParams.get("status") as ActivityStatus)
    : undefined;
  const category = searchParams.get("category")?.trim() ?? undefined;
  const published = searchParams.get("published");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listActivities({
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
    console.error("[admin] activities list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Activities could not be loaded." },
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

  const required = ["title", "slug", "category", "description", "status"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "validation", message: `${field} is required.` },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  if (!STATUSES.includes(body.status as ActivityStatus)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid activity status." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const activity = await createActivity(
      {
        title: String(body.title).trim(),
        slug: String(body.slug).trim(),
        category: String(body.category).trim(),
        description: String(body.description).trim(),
        objectives: String(body.objectives ?? "").trim(),
        eligibility: String(body.eligibility ?? "").trim(),
        venue: String(body.venue ?? "").trim(),
        venueType: (body.venueType as any) || "physical",
        startDate: body.startDate !== undefined ? (body.startDate as string | null) : null,
        endDate: body.endDate !== undefined ? (body.endDate as string | null) : null,
        startTime: String(body.startTime ?? "").trim(),
        endTime: String(body.endTime ?? "").trim(),
        duration: String(body.duration ?? "").trim(),
        applicationOpensAt: body.applicationOpensAt !== undefined ? (body.applicationOpensAt as string | null) : null,
        applicationDeadline: body.applicationDeadline !== undefined ? (body.applicationDeadline as string | null) : null,
        totalSlots: parseInt(String(body.totalSlots ?? "0"), 10) || 0,
        fee: parseInt(String(body.fee ?? "0"), 10) || 0,
        currency: String(body.currency ?? "SLE").trim(),
        isFree: body.isFree === true,
        applicationsEnabled: body.applicationsEnabled !== false,
        posterImageId: String(body.posterImageId ?? "").trim(),
        imageIds: Array.isArray(body.imageIds) ? body.imageIds : [],
        organizer: String(body.organizer ?? "Jallal Group").trim(),
        status: body.status as ActivityStatus,
        publishAt: body.publishAt !== undefined ? (body.publishAt as string | null) : null,
        published: body.published === true,
      },
      admin,
    );
    return NextResponse.json({ ok: true, activity }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] activity create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create activity." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
