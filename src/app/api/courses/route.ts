import { NextResponse } from "next/server";
import {
  BackendNotConfiguredError,
  getCourseByCode,
  listCourses,
} from "@/lib/courses";
import type { CourseStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: CourseStatus[] = ["available", "full", "closed"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = STATUSES.includes(searchParams.get("status") as CourseStatus)
    ? (searchParams.get("status") as CourseStatus)
    : undefined;
  const category = searchParams.get("category")?.trim() ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listCourses({
      search: q,
      status,
      category,
      published: true,
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
    console.error("[public] courses list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Courses could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
