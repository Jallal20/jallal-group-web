import { NextResponse } from "next/server";
import {
  BackendNotConfiguredError,
  listProjects,
} from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? undefined;
    const type = searchParams.get("type")?.trim() ?? undefined;
    const category = searchParams.get("category")?.trim() ?? undefined;
    const published = searchParams.get("published");
    const featured = searchParams.get("featured");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

    const result = await listProjects({
      search: q || undefined,
      status: status || undefined,
      type: type || undefined,
      category: category || undefined,
      published: published === "true" ? true : published === "false" ? false : undefined,
      featured: featured === "true" ? true : featured === "false" ? false : undefined,
      limit,
    });

    return NextResponse.json(
      { ok: true, items: result.items, total: result.total },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[api] projects list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Projects could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}