import "server-only";

import { ID } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env } from "@/lib/env";

export async function writeAuditLog({
  adminId,
  adminEmail,
  action,
  module,
  recordId = "",
  details = "",
}: {
  adminId: string;
  adminEmail: string;
  action: string;
  module: string;
  recordId?: string;
  details?: string;
}): Promise<void> {
  try {
    await adminTablesDB().createRow({
      databaseId: env.databaseId,
      tableId: env.auditLogsId,
      rowId: ID.unique(),
      data: {
        adminId,
        adminEmail,
        action,
        module,
        recordId,
        timestamp: new Date().toISOString(),
        details,
      },
    });
  } catch {
    // Audit logging must never break the primary operation.
    console.error("[audit] failed to write audit log");
  }
}
