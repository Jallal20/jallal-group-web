import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  applicationStats,
  deleteApplication,
  getApplication,
  getApplicationsByStudent,
  listApplications,
  updateApplicationStatus,
} from "@/lib/applications";
import type { ApplicationStatus } from "@/lib/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ApplicationStatus[] = [
  "submitted", "under-review", "shortlisted", "approved", "rejected", "waitlisted", "withdrawn",
];

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "applications.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage applications." },
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
  const status = STATUSES.includes(searchParams.get("status") as ApplicationStatus)
    ? (searchParams.get("status") as ApplicationStatus)
    : undefined;
  const activityId = searchParams.get("activityId")?.trim() ?? undefined;
  const studentId = searchParams.get("studentId")?.trim() ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listApplications({ search: q, status, activityId, studentId, limit });
    const stats = await applicationStats(activityId);
    return NextResponse.json({ ok: true, items: result.items, total: result.total, stats });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] applications list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Applications could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
