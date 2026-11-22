import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  listEnrollments,
} from "@/lib/enrollments";
import type { EnrollmentStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: EnrollmentStatus[] = ["pending", "under-review", "accepted", "rejected", "enrolled"];

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "enrollments.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage enrollments." },
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
  const status = STATUSES.includes(searchParams.get("status") as EnrollmentStatus)
    ? (searchParams.get("status") as EnrollmentStatus)
    : undefined;
  const courseId = searchParams.get("course")?.trim() ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listEnrollments({
      search: q,
      status,
      courseId,
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
    console.error("[admin] enrollments list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Enrollments could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
