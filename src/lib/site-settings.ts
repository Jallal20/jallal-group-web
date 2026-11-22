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

type SiteSettingRow = Models.Row & {
  key: string;
  value: string;
  updatedBy: string;
  updatedAt: string;
};

function toSiteSetting(row: SiteSettingRow) {
  return {
    id: row.$id,
    key: row.key,
    value: row.value,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.siteSettingsId;

export type SiteSettingFilters = {
  search?: string;
  limit?: number;
};

export type SiteSettingInput = {
  key: string;
  value: string;
  updatedBy: string;
};

export async function listSiteSettings(
  filters: SiteSettingFilters = {},
): Promise<{ items: ReturnType<typeof toSiteSetting>[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [Query.orderAsc("key")];

  queries.push(Query.limit(Math.min(filters.limit ?? 100, 200)));

  const result = await db.listRows<SiteSettingRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toSiteSetting);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (s) => s.key.toLowerCase().includes(q) || s.value.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getSiteSetting(key: string) {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<SiteSettingRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("key", key), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toSiteSetting(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createSiteSetting(
  input: SiteSettingInput,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const db = adminTablesDB();

  const existing = await getSiteSetting(input.key);
  if (existing) {
    throw new Error(`A setting with key "${input.key}" already exists.`);
  }

  const row = await db.createRow<SiteSettingRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      key: input.key,
      value: input.value,
      updatedBy: input.updatedBy,
      updatedAt: new Date().toISOString(),
    },
  });

  const setting = toSiteSetting(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "site-settings",
      recordId: setting.id,
      details: `Created site setting "${setting.key}"`,
    });
  }

  return setting;
}

export async function updateSiteSetting(
  key: string,
  value: string,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const existing = await getSiteSetting(key);
  if (!existing) {
    throw new Error(`Site setting with key "${key}" not found.`);
  }

  const row = await adminTablesDB().updateRow<SiteSettingRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: existing.id,
    data: { value, updatedBy: admin?.email ?? "", updatedAt: new Date().toISOString() },
  });

  const setting = toSiteSetting(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "site-settings",
      recordId: existing.id,
      details: `Updated site setting "${setting.key}"`,
    });
  }

  return setting;
}

export async function deleteSiteSetting(
  key: string,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const existing = await getSiteSetting(key);
  if (!existing) {
    throw new Error(`Site setting with key "${key}" not found.`);
  }

  await adminTablesDB().deleteRow({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: existing.id,
  });

  if (admin && existing) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete",
      module: "site-settings",
      recordId: existing.id,
      details: `Deleted site setting "${existing.key}"`,
    });
  }
}

export async function getAllSettingsAsMap(): Promise<Record<string, string>> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<SiteSettingRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [],
      total: false,
    });

    const map: Record<string, string> = {};
    for (const row of result.rows) {
      map[row.key] = row.value;
    }
    return map;
  } catch {
    return {};
  }
}
