import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createFormField,
  deleteFormField,
  listFormFields,
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
    const fields = await listFormFields(id);
    return NextResponse.json({ ok: true, items: fields, total: fields.length });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] form fields list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Form fields could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<Params> }) {
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

  if (!body.label || String(body.label).trim() === "") {
    return NextResponse.json(
      { ok: false, code: "validation", message: "label is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!body.name || String(body.name).trim() === "") {
    return NextResponse.json(
      { ok: false, code: "validation", message: "name is required." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!FIELD_TYPES.includes(body.fieldType as FieldType)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "Invalid field type." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const field = await createFormField(
      {
        formId: id,
        fieldType: body.fieldType as FieldType,
        label: String(body.label).trim(),
        name: String(body.name).trim(),
        description: String(body.description ?? "").trim(),
        required: body.required === true,
        position: parseInt(String(body.position ?? 0), 10) || 0,
        options: Array.isArray(body.options) ? body.options : [],
        minLength: body.minLength !== undefined ? parseInt(String(body.minLength), 10) || null : null,
        maxLength: body.maxLength !== undefined ? parseInt(String(body.maxLength), 10) || null : null,
        acceptedFileTypes: Array.isArray(body.acceptedFileTypes) ? body.acceptedFileTypes : [],
        maxFileSizeMB: body.maxFileSizeMB !== undefined ? parseInt(String(body.maxFileSizeMB), 10) || null : null,
        placeholder: String(body.placeholder ?? "").trim(),
      },
      admin,
    );
    return NextResponse.json({ ok: true, field }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] form field create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create form field." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
