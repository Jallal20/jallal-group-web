import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createApplicationForm,
  deleteApplicationForm,
  listApplicationForms,
  updateApplicationForm,
} from "@/lib/application-forms";
import type { FormStatus } from "@/lib/application-forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: FormStatus[] = ["draft", "open", "closed"];

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "applicationForms.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage application forms." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

export async function GET(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  try {
    const forms = await listApplicationForms();
    return NextResponse.json({ ok: true, items: forms, total: forms.length });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] application forms list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Application forms could not be loaded." },
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

  if (!body.activityId || String(body.activityId).trim() === "") {
    return NextResponse.json(
      { ok: false, code: "validation", message: "activityId is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!STATUSES.includes((body.status as FormStatus) ?? "draft")) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid form status." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const form = await createApplicationForm(
      {
        activityId: String(body.activityId).trim(),
        activityTitle: String(body.activityTitle ?? "").trim(),
        title: String(body.title ?? "Application Form").trim(),
        description: String(body.description ?? "").trim(),
        confirmationMessage: String(body.confirmationMessage ?? "Thank you for your application.").trim(),
        allowEditingAfterSubmit: body.allowEditingAfterSubmit === true,
        status: (body.status as FormStatus) ?? "draft",
        published: body.published === true,
      },
      admin,
    );
    return NextResponse.json({ ok: true, form }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] application form create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create application form." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
