import { NextResponse } from "next/server";
import { getCurrentAdmin, hasPermission, requireAdmin } from "@/lib/auth";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { Query, type Models } from "node-appwrite";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AuditLogRow = Models.Row & {
  adminId: string;
  adminEmail: string;
  action: string;
  module: string;
  recordId: string;
  timestamp: string;
  details: string;
};

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!hasPermission(admin, "auditLogs.view")) {
    return NextResponse.json(
      { ok: false, code: "forbidden", message: "You are not authorised to view audit logs." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!isAppwriteConfigured()) {
    return NextResponse.json(
      { ok: false, code: "not_configured", message: "Appwrite is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const moduleFilter = searchParams.get("module")?.trim() ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 200);

  try {
    const queries: string[] = [Query.orderDesc("$createdAt"), Query.limit(limit)];
    if (moduleFilter) queries.push(Query.equal("module", moduleFilter));

    const result = await adminTablesDB().listRows<AuditLogRow>({
      databaseId: env.databaseId,
      tableId: env.auditLogsId,
      queries,
      total: true,
    });

    let items = result.rows.map((row) => ({
      id: row.$id,
      adminId: row.adminId,
      adminEmail: row.adminEmail,
      action: row.action,
      module: row.module,
      recordId: row.recordId,
      timestamp: row.timestamp,
      details: row.details,
    }));

    if (q) {
      const query = q.toLowerCase();
      items = items.filter(
        (log) =>
          log.adminEmail.toLowerCase().includes(query) ||
          log.action.toLowerCase().includes(query) ||
          log.module.toLowerCase().includes(query) ||
          log.details.toLowerCase().includes(query),
      );
    }

    return NextResponse.json({ ok: true, items, total: result.total ?? items.length });
  } catch (error) {
    console.error("[admin] audit logs list failed:", error);
    return NextResponse.json(
      { ok: false, code: "server_error", message: "Audit logs could not be loaded." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
