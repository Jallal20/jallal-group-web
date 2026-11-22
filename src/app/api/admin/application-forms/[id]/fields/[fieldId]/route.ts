import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  deleteFormField,
  reorderFormFields,
  updateFormField,
} from "@/lib/application-forms";
import type { FieldType } from "@/lib/application-forms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIELD_TYPES: FieldType[] = [
  "fullName", "email", "phone", "dateOfBirth", "gender", "institution",
  "educationalLevel", "courseOfStudy", "address", "emergencyContact",
  "shortText", "longText", "dropdown", "multipleChoice", "checkboxes",
  "date", "fileUpload", "cvUpload", "idUpload", "motivationStatement",
  "previousExperience", "customQuestion",
];

type Params = { id: string; fieldId: string };

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

export async function PATCH(request: Request, { params }: { params: Promise<Params> }) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { fieldId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (body.fieldType !== undefined && !FIELD_TYPES.includes(body.fieldType as FieldType)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid field type." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const field = await updateFormField(fieldId, {
      fieldType: body.fieldType as FieldType | undefined,
      label: body.label !== undefined ? String(body.label).trim() : undefined,
      name: body.name !== undefined ? String(body.name).trim() : undefined,
      description: body.description !== undefined ? String(body.description).trim() : undefined,
      required: body.required !== undefined ? body.required === true : undefined,
      position: body.position !== undefined ? parseInt(String(body.position), 10) || 0 : undefined,
      options: body.options !== undefined ? (Array.isArray(body.options) ? body.options : []) : undefined,
      minLength: body.minLength !== undefined ? parseInt(String(body.minLength), 10) || null : undefined,
      maxLength: body.maxLength !== undefined ? parseInt(String(body.maxLength), 10) || null : undefined,
      acceptedFileTypes: body.acceptedFileTypes !== undefined ? (Array.isArray(body.acceptedFileTypes) ? body.acceptedFileTypes : []) : undefined,
      maxFileSizeMB: body.maxFileSizeMB !== undefined ? parseInt(String(body.maxFileSizeMB), 10) || null : undefined,
      placeholder: body.placeholder !== undefined ? String(body.placeholder).trim() : undefined,
    }, admin);
    return NextResponse.json({ ok: true, field });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] form field update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update form field." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<Params> }) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { fieldId } = await params;

  try {
    await deleteFormField(fieldId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] form field delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete form field." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
