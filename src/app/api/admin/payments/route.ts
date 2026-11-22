import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import { BackendNotConfiguredError, listCoursePayments } from "@/lib/course-payments";
import type { PaymentStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: PaymentStatus[] = ["submitted", "verified", "rejected"];

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "coursePayments.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to verify payments." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

export async function GET(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = STATUSES.includes(searchParams.get("status") as PaymentStatus)
    ? (searchParams.get("status") as PaymentStatus)
    : undefined;
  const courseId = searchParams.get("course")?.trim() || undefined;
  const applicationId = searchParams.get("application")?.trim() || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const result = await listCoursePayments({
      search: q,
      status,
      courseId,
      applicationId,
      limit,
    });
    return NextResponse.json({ ok: true, admin, items: result.items, total: result.total });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] course payments list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Payments could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
