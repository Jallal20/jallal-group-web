import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  createLearningMaterial,
  deleteLearningMaterial,
  getLearningMaterial,
  listLearningMaterials,
  updateLearningMaterial,
} from "@/lib/learning-materials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "programs.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to manage learning materials." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

export async function GET(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get("activityId")?.trim() ?? undefined;

  try {
    const items = await listLearningMaterials(activityId);
    return NextResponse.json({ ok: true, items, total: items.length });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] learning materials list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Learning materials could not be loaded." },
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

  const required = ["activityId", "activityTitle", "title", "materialType"];
  for (const field of required) {
    if (!body[field] || String(body[field]).trim() === "") {
      return NextResponse.json(
        { ok: false, code: "validation", message: `${field} is required.` },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  try {
    const material = await createLearningMaterial(
      {
        activityId: String(body.activityId).trim(),
        activityTitle: String(body.activityTitle).trim(),
        title: String(body.title).trim(),
        description: String(body.description ?? "").trim(),
        materialType: body.materialType as any,
        fileId: String(body.fileId ?? "").trim(),
        fileName: String(body.fileName ?? "").trim(),
        url: String(body.url ?? "").trim(),
        published: body.published === true,
      },
      admin,
    );
    return NextResponse.json({ ok: true, material }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] learning material create failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to create learning material." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PUT(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "id query parameter is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const material = await updateLearningMaterial(id, {
      title: body.title !== undefined ? String(body.title).trim() : undefined,
      description: body.description !== undefined ? String(body.description).trim() : undefined,
      materialType: body.materialType as any,
      fileId: body.fileId !== undefined ? String(body.fileId).trim() : undefined,
      fileName: body.fileName !== undefined ? String(body.fileName).trim() : undefined,
      url: body.url !== undefined ? String(body.url).trim() : undefined,
      published: body.published !== undefined ? body.published === true : undefined,
    }, admin);
    return NextResponse.json({ ok: true, material }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] learning material update failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to update learning material." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(request: Request) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });
  const admin = authorised.admin;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, code: "validation", message: "id query parameter is required." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await deleteLearningMaterial(id, admin);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] learning material delete failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Failed to delete learning material." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
