import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type NotificationRow = Models.Row & {
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string;
  createdAt: string;
};

function toNotification(row: NotificationRow) {
  return {
    id: row.$id,
    userId: row.userId,
    title: row.title,
    message: row.message,
    type: row.type,
    read: row.read,
    link: row.link,
    createdAt: row.createdAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = "notifications";

export type NotificationFilters = {
  userId?: string;
  unreadOnly?: boolean;
  limit?: number;
};

export type NotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  link: string;
};

export async function listNotifications(
  filters: NotificationFilters = {},
): Promise<{ items: ReturnType<typeof toNotification>[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.userId) {
    queries.push(Query.equal("userId", filters.userId));
  }
  if (filters.unreadOnly) {
    queries.push(Query.equal("read", false));
  }

  queries.push(Query.orderDesc("createdAt"));
  queries.push(Query.limit(Math.min(filters.limit ?? 50, 200)));

  const result = await db.listRows<NotificationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  return { items: result.rows.map(toNotification), total: result.total ?? result.rows.length };
}

export async function createNotification(
  input: NotificationInput,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const db = adminTablesDB();

  const row = await db.createRow<NotificationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type,
      read: false,
      link: input.link,
      createdAt: new Date().toISOString(),
    },
  });

  const notification = toNotification(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "notifications",
      recordId: notification.id,
      details: `Created notification "${notification.title}" for user ${notification.userId}`,
    });
  }

  return notification;
}

export async function markNotificationRead(
  id: string,
  admin?: { id: string; email: string },
) {
  requireBackend();

  try {
    const row = await adminTablesDB().updateRow<NotificationRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
      data: { read: true },
    });

    if (admin) {
      await writeAuditLog({
        adminId: admin.id,
        adminEmail: admin.email,
        action: "update",
        module: "notifications",
        recordId: id,
        details: `Marked notification ${id} as read`,
      });
    }

    return toNotification(row);
  } catch {
    return null;
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<NotificationRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("userId", userId), Query.equal("read", false)],
      total: true,
    });
    return result.total ?? 0;
  } catch {
    return 0;
  }
}

export async function deleteNotification(
  id: string,
  admin?: { id: string; email: string },
) {
  requireBackend();

  await adminTablesDB().deleteRow({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
  });

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete",
      module: "notifications",
      recordId: id,
      details: `Deleted notification ${id}`,
    });
  }
}
