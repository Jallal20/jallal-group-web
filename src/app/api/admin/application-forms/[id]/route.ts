import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteApplicationForm,
  getApplicationForm,
  updateApplicationForm,
} from "@/lib/application-forms";
import type { FormStatus } from "@/lib/application-forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: FormStatus[] = ["draft", "open", "closed"];

type Params = { id: string };

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

export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;

  try {
    const form = await getApplicationForm(id);
    if (!form) {
      return NextResponse.json(
        { ok: false, code: "not_found", message: "Application form not found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json({ ok: true, form });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] application form get failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Application form could not be loaded." },
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

  if (body.status && !STATUSES.includes(body.status as FormStatus)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid form status." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const form = await updateApplicationForm(id, {
      title: body.title !== undefined ? String(body.title).trim() : undefined,
      description: body.description !== undefined ? String(body.description).trim() : undefined,
      confirmationMessage: body.confirmationMessage !== undefined ? String(body.confirmationMessage).trim() : undefined,
      allowEditingAfterSubmit: body.allowEditingAfterSubmit !== undefined ? body.allowEditingAfterSubmit === true : undefined,
      status: body.status as FormStatus | undefined,
      published: body.published !== undefined ? body.published === true : undefined,
    }, admin);
    return NextResponse.json({ ok: true, form });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] application form update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update application form." },
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
    await deleteApplicationForm(id, admin);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] application form delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete application form." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
