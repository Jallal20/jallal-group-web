import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import { BackendNotConfiguredError, listStatusHistory } from "@/lib/application-status-history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { id: string };

async function guard() {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "courseApplications.manage")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to view application history." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  return { admin };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const authorised = await guard();
  if (!authorised || "ok" in authorised) return authorised ?? NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;

  try {
    const history = await listStatusHistory(id);
    return NextResponse.json({ ok: true, items: history });
  } catch (error) {
    if (error instanceof BackendNotConfiguredError) {
      return NextResponse.json(
        { ok: false, code: "not_configured", message: "Appwrite is not configured." },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    console.error("[admin] status history list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Status history could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
