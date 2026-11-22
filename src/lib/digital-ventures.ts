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

type DigitalVentureRow = Models.Row & {
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  imageIds: string;
  websiteUrl: string;
  featured: boolean;
  published: boolean;
};

function toDigitalVenture(row: DigitalVentureRow) {
  return {
    id: row.$id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    status: row.status,
    imageIds: JSON.parse(row.imageIds ?? "[]"),
    websiteUrl: row.websiteUrl,
    featured: row.featured,
    published: row.published,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = "digital_ventures";

export type DigitalVentureFilters = {
  search?: string;
  status?: string;
  category?: string;
  published?: boolean;
  limit?: number;
};

export type DigitalVentureInput = {
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  imageIds: string[];
  websiteUrl: string;
  featured: boolean;
  published: boolean;
};

export async function listDigitalVentures(
  filters: DigitalVentureFilters = {},
): Promise<{ items: ReturnType<typeof toDigitalVenture>[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.status) {
    queries.push(Query.equal("status", filters.status));
  }
  if (filters.category) {
    queries.push(Query.equal("category", filters.category));
  }
  if (filters.published !== undefined) {
    queries.push(Query.equal("published", filters.published));
  }

  queries.push(Query.orderDesc("$createdAt"));
  queries.push(Query.limit(Math.min(filters.limit ?? 50, 200)));

  const result = await db.listRows<DigitalVentureRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toDigitalVenture);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getDigitalVenture(id: string) {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<DigitalVentureRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toDigitalVenture(row);
  } catch {
    return null;
  }
}

export async function getDigitalVentureBySlug(slug: string) {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<DigitalVentureRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("slug", slug), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toDigitalVenture(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createDigitalVenture(
  input: DigitalVentureInput,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const db = adminTablesDB();

  const existing = await getDigitalVentureBySlug(input.slug);
  if (existing) {
    throw new Error(`A digital venture with slug "${input.slug}" already exists.`);
  }

  const row = await db.createRow<DigitalVentureRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      category: input.category,
      status: input.status,
      imageIds: JSON.stringify(input.imageIds),
      websiteUrl: input.websiteUrl,
      featured: input.featured,
      published: input.published,
    },
  });

  const venture = toDigitalVenture(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "digital-ventures",
      recordId: venture.id,
      details: `Created digital venture "${venture.name}"`,
    });
  }

  return venture;
}

export async function updateDigitalVenture(
  id: string,
  input: Partial<DigitalVentureInput>,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const existing = await getDigitalVenture(id);
  if (!existing) {
    throw new Error(`Digital venture with id "${id}" not found.`);
  }

  if (input.slug && input.slug !== existing.slug) {
    const existingBySlug = await getDigitalVentureBySlug(input.slug);
    if (existingBySlug) {
      throw new Error(`A digital venture with slug "${input.slug}" already exists.`);
    }
  }

  const row = await adminTablesDB().updateRow<DigitalVentureRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.imageIds !== undefined && { imageIds: JSON.stringify(input.imageIds) }),
      ...(input.websiteUrl !== undefined && { websiteUrl: input.websiteUrl }),
      ...(input.featured !== undefined && { featured: input.featured }),
      ...(input.published !== undefined && { published: input.published }),
    },
  });

  const venture = toDigitalVenture(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "digital-ventures",
      recordId: id,
      details: `Updated digital venture "${venture.name}"`,
    });
  }

  return venture;
}

export async function deleteDigitalVenture(
  id: string,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const existing = await getDigitalVenture(id);
  if (!existing) {
    throw new Error(`Digital venture with id "${id}" not found.`);
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
      module: "digital-ventures",
      recordId: id,
      details: `Deleted digital venture "${existing.name}"`,
    });
  }
}
