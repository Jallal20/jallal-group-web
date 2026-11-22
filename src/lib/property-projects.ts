import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import type { ProjectStatus } from "@/lib/types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type PropertyProjectRow = Models.Row & {
  name: string;
  slug: string;
  description: string;
  location: string;
  category: string;
  status: ProjectStatus;
  imageIds: string[];
  highlights: string[];
  expectedLaunchDate: string | null;
  published: boolean;
};

function toPropertyProject(row: PropertyProjectRow) {
  return {
    id: row.$id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    location: row.location,
    category: row.category,
    status: row.status,
    imageIds: row.imageIds,
    highlights: row.highlights,
    expectedLaunchDate: row.expectedLaunchDate,
    published: row.published,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.propertyProjectsId;

export type PropertyProjectFilters = {
  search?: string;
  status?: ProjectStatus;
  category?: string;
  published?: boolean;
  limit?: number;
};

export async function listPropertyProjects(
  filters: PropertyProjectFilters = {},
): Promise<{ items: ReturnType<typeof toPropertyProject>[]; total: number }> {
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

  const result = await db.listRows<PropertyProjectRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toPropertyProject);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getPropertyProject(id: string) {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<PropertyProjectRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toPropertyProject(row);
  } catch {
    return null;
  }
}

export async function getPropertyProjectBySlug(slug: string) {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<PropertyProjectRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("slug", slug), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toPropertyProject(result.rows[0]);
  } catch {
    return null;
  }
}

export type PropertyProjectInput = {
  name: string;
  slug: string;
  description: string;
  location: string;
  category: string;
  status: ProjectStatus;
  imageIds: string[];
  highlights: string[];
  expectedLaunchDate: string | null;
  published: boolean;
};

export async function createPropertyProject(
  input: PropertyProjectInput,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const db = adminTablesDB();

  const existing = await getPropertyProjectBySlug(input.slug);
  if (existing) {
    throw new Error(`A project with slug "${input.slug}" already exists.`);
  }

  const row = await db.createRow<PropertyProjectRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      location: input.location,
      category: input.category,
      status: input.status,
      imageIds: input.imageIds,
      highlights: input.highlights,
      expectedLaunchDate: input.expectedLaunchDate,
      published: input.published,
    },
  });

  const project = toPropertyProject(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "propertyProjects",
      recordId: project.id,
      details: `Created property project "${project.name}"`,
    });
  }

  return project;
}

export async function updatePropertyProject(
  id: string,
  input: Partial<PropertyProjectInput>,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const existing = await getPropertyProject(id);
  if (!existing) {
    throw new Error(`Property project with id "${id}" not found.`);
  }

  if (input.slug && input.slug !== existing.slug) {
    const existingBySlug = await getPropertyProjectBySlug(input.slug);
    if (existingBySlug) {
      throw new Error(`A project with slug "${input.slug}" already exists.`);
    }
  }

  const row = await adminTablesDB().updateRow<PropertyProjectRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.imageIds !== undefined && { imageIds: input.imageIds }),
      ...(input.highlights !== undefined && { highlights: input.highlights }),
      ...(input.expectedLaunchDate !== undefined && {
        expectedLaunchDate: input.expectedLaunchDate,
      }),
      ...(input.published !== undefined && { published: input.published }),
    },
  });

  const project = toPropertyProject(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "propertyProjects",
      recordId: id,
      details: `Updated property project "${project.name}"`,
    });
  }

  return project;
}

export async function deletePropertyProject(
  id: string,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const existing = await getPropertyProject(id);
  if (!existing) {
    throw new Error(`Property project with id "${id}" not found.`);
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
      module: "propertyProjects",
      recordId: id,
      details: `Deleted property project "${existing.name}"`,
    });
  }
}
