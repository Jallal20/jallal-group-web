import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import { BackendNotConfiguredError, uploadFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "content.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to upload media." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

export async function POST(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

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

  const allowImages = formData.get("allowImages") === "true";
  const allowVideos = formData.get("allowVideos") === "true";

  try {
    const record = await uploadFile(file, {
      uploadedBy: admin.id,
      admin,
      allowImages,
      allowVideos,
      module: "media-library",
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
    console.error("[admin] media upload failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: error instanceof Error ? error.message : "Upload failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
