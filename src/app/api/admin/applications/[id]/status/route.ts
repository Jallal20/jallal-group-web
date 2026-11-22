import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  getApplication,
  updateApplicationStatus,
} from "@/lib/applications";
import type { ApplicationStatus } from "@/lib/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: ApplicationStatus[] = [
  "submitted", "under-review", "shortlisted", "approved", "rejected", "waitlisted", "withdrawn",
];

type Params = { id: string };

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

  const status = body.status as ApplicationStatus | undefined;
  if (!status || !STATUSES.includes(status)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "A valid status is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const application = await updateApplicationStatus(
      id,
      status,
      String(body.adminNotes ?? "").trim(),
      body.decisionMessage !== undefined ? String(body.decisionMessage).trim() : null,
      admin,
    );
    return NextResponse.json({ ok: true, application });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] application status update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update application status." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
