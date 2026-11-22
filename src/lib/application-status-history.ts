import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import type {
  ApplicationStatusHistoryEntry,
  CourseApplicationStatus,
} from "@/lib/types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type StatusHistoryRow = Models.Row & {
  applicationId: string;
  status: CourseApplicationStatus;
  changedBy: string;
  changedByEmail: string;
  changedByRole: string;
  changedAt: string;
  notes: string;
};

function toStatusHistoryEntry(
  row: StatusHistoryRow,
): ApplicationStatusHistoryEntry {
  return {
    id: row.$id,
    applicationId: row.applicationId,
    status: row.status,
    changedBy: row.changedBy,
    changedByEmail: row.changedByEmail,
    changedByRole: row.changedByRole,
    changedAt: row.changedAt,
    notes: row.notes,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = "course_application_status_history";

export async function listStatusHistory(
  applicationId: string,
): Promise<ApplicationStatusHistoryEntry[]> {
  requireBackend();

  const result = await adminTablesDB().listRows<StatusHistoryRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries: [
      Query.equal("applicationId", applicationId),
      Query.orderDesc("changedAt"),
      Query.limit(100),
    ],
    total: false,
  });

  return result.rows.map(toStatusHistoryEntry);
}

export async function createStatusHistoryEntry({
  applicationId,
  status,
  changedBy,
  changedByEmail,
  changedByRole,
  notes,
}: {
  applicationId: string;
  status: CourseApplicationStatus;
  changedBy: string;
  changedByEmail: string;
  changedByRole: string;
  notes?: string;
}): Promise<ApplicationStatusHistoryEntry> {
  requireBackend();

  const db = adminTablesDB();
  const row = await db.createRow<StatusHistoryRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      applicationId,
      status,
      changedBy,
      changedByEmail,
      changedByRole,
      changedAt: new Date().toISOString(),
      notes: notes ?? "",
    },
  });

  const entry = toStatusHistoryEntry(row);

  await writeAuditLog({
    adminId: changedBy,
    adminEmail: changedByEmail,
    action: "status_change",
    module: "course_applications",
    recordId: applicationId,
    details: `Changed application ${applicationId} status to ${status}`,
  });

  return entry;
}
