import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadFile } from "@/lib/storage";
import { getCurrentStudent, STUDENT_SESSION_COOKIE } from "@/lib/student-auth";
import { BackendNotConfiguredError } from "@/lib/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireStudent() {
  const student = await getCurrentStudent();
  if (!student) {
    return NextResponse.json(
      { ok: false, code: "unauthenticated", message: "You must be logged in." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { student };
}

export async function POST(request: Request) {
  const authorised = await requireStudent();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const student = authorised.student;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Expected multipart/form-data." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Unable to parse upload data." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "No file provided." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const record = await uploadFile(file, {
      uploadedBy: student.id,
      allowImages: false,
      allowVideos: false,
      module: "student-applications",
      recordId: "",
      action: "upload",
    });

    return NextResponse.json({ ok: true, file: record }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[student] upload failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: error instanceof Error ? error.message : "Upload failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
