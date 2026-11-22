import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteApplication,
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

export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;

  try {
    const application = await getApplication(id);
    if (!application) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Application not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, application });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] application get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Application could not be loaded." },
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
    await deleteApplication(id, admin);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] application delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete application." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
