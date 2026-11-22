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

type CompanyRow = Models.Row & {
  slug: string;
  name: string;
  order: number;
  payload: string;
};

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.companiesCollectionId;

export type CompanyRecord = {
  id: string;
  slug: string;
  name: string;
  order: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CompanyFilters = {
  search?: string;
  limit?: number;
};

export type CompanyInput = {
  slug: string;
  name: string;
  order?: number;
  payload: Record<string, unknown>;
};

function toCompany(row: CompanyRow): CompanyRecord {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(row.payload) ?? {};
  } catch {
    payload = {};
  }
  return {
    id: row.$id,
    slug: row.slug,
    name: row.name,
    order: row.order,
    payload,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

export async function listCompanies(
  filters: CompanyFilters = {},
): Promise<{ items: CompanyRecord[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [Query.orderAsc("order"), Query.limit(Math.min(filters.limit ?? 100, 200))];

  const result = await db.listRows<CompanyRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toCompany);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        JSON.stringify(c.payload).toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getCompany(id: string): Promise<CompanyRecord | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<CompanyRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toCompany(row);
  } catch {
    return null;
  }
}

export async function getCompanyBySlug(slug: string): Promise<CompanyRecord | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<CompanyRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("slug", slug), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toCompany(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createCompany(
  input: CompanyInput,
  admin?: { id: string; email: string },
): Promise<CompanyRecord> {
  requireBackend();

  const db = adminTablesDB();

  const existing = await getCompanyBySlug(input.slug);
  if (existing) {
    throw new Error(`A company with slug "${input.slug}" already exists.`);
  }

  const row = await db.createRow<CompanyRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      slug: input.slug,
      name: input.name,
      order: input.order ?? 0,
      payload: JSON.stringify(input.payload),
    },
  });

  const company = toCompany(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "companies",
      recordId: company.id,
      details: `Created company "${company.name}"`,
    });
  }

  return company;
}

export async function updateCompany(
  id: string,
  input: Partial<CompanyInput>,
  admin?: { id: string; email: string },
): Promise<CompanyRecord> {
  requireBackend();

  const existing = await getCompany(id);
  if (!existing) {
    throw new Error(`Company with id "${id}" not found.`);
  }

  if (input.slug && input.slug !== existing.slug) {
    const existingBySlug = await getCompanyBySlug(input.slug);
    if (existingBySlug) {
      throw new Error(`A company with slug "${input.slug}" already exists.`);
    }
  }

  const row = await adminTablesDB().updateRow<CompanyRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.payload !== undefined && { payload: JSON.stringify(input.payload) }),
    },
  });

  const company = toCompany(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "companies",
      recordId: id,
      details: `Updated company "${company.name}"`,
    });
  }

  return company;
}

export async function deleteCompany(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getCompany(id);
  if (!existing) {
    throw new Error(`Company with id "${id}" not found.`);
  }

  await adminTablesDB().deleteRow({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
  });

  if (admin && existing) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete",
      module: "companies",
      recordId: id,
      details: `Deleted company "${existing.name}"`,
    });
  }
}

export async function getCompanyPayload(slug: string): Promise<Record<string, unknown> | null> {
  const company = await getCompanyBySlug(slug);
  return company ? company.payload : null;
}
