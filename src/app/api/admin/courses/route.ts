import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createCourse,
  listCourses,
} from "@/lib/courses";
import type { CourseStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: CourseStatus[] = ["available", "full", "closed"];

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "courses.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage courses." },
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
  const status = STATUSES.includes(searchParams.get("status") as CourseStatus)
    ? (searchParams.get("status") as CourseStatus)
    : undefined;
  const category = searchParams.get("category")?.trim() ?? undefined;
  const published = searchParams.get("published");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listCourses({
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
    console.error("[admin] courses list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Courses could not be loaded." },
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

  const required = ["name", "code", "category", "description", "duration", "status"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "validation", message: `${field} is required.` },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  if (!STATUSES.includes(body.status as CourseStatus)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid course status." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const course = await createCourse(
      {
        name: String(body.name).trim(),
        code: String(body.code).trim(),
        category: String(body.category).trim(),
        description: String(body.description).trim(),
        objectives: String(body.objectives ?? "").trim(),
        duration: String(body.duration).trim(),
        fee: parseInt(String(body.fee ?? "0"), 10) || 0,
        currency: String(body.currency ?? "SLE").trim(),
        requirements: String(body.requirements ?? "").trim(),
        imageId: String(body.imageId ?? "").trim(),
        capacity: parseInt(String(body.capacity ?? "0"), 10) || 0,
        status: body.status as CourseStatus,
        published: body.published === true,
      },
      admin,
    );

    return NextResponse.json({ ok: true, course }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] course create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create course." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
