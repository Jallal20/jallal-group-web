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

type ProjectRow = Models.Row & {
  name: string;
  slug: string;
  description: string;
  category: string;
  imageIds: string[];
  status: ProjectStatus;
  published: boolean;
};

function toProject(row: ProjectRow) {
  return {
    id: row.$id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    category: row.category,
    imageIds: row.imageIds,
    status: row.status,
    published: row.published,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.techProjectsId;

export type ProjectFilters = {
  search?: string;
  status?: ProjectStatus;
  category?: string;
  published?: boolean;
  limit?: number;
};

export type ProjectInput = {
  name: string;
  slug: string;
  description: string;
  category: string;
  imageIds: string[];
  status: ProjectStatus;
  published: boolean;
};

export async function listProjects(
  filters: ProjectFilters = {},
): Promise<{ items: ReturnType<typeof toProject>[]; total: number }> {
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

  const result = await db.listRows<ProjectRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toProject);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getProject(id: string) {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<ProjectRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toProject(row);
  } catch {
    return null;
  }
}

export async function getProjectBySlug(slug: string) {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<ProjectRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("slug", slug), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toProject(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createProject(
  input: ProjectInput,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const db = adminTablesDB();

  const existing = await getProjectBySlug(input.slug);
  if (existing) {
    throw new Error(`A project with slug "${input.slug}" already exists.`);
  }

  const row = await db.createRow<ProjectRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      category: input.category,
      imageIds: input.imageIds,
      status: input.status,
      published: input.published,
    },
  });

  const project = toProject(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "techProjects",
      recordId: project.id,
      details: `Created Jallal Tech project "${project.name}"`,
    });
  }

  return project;
}

export async function updateProject(
  id: string,
  input: Partial<ProjectInput>,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const existing = await getProject(id);
  if (!existing) {
    throw new Error(`Project with id "${id}" not found.`);
  }

  if (input.slug && input.slug !== existing.slug) {
    const existingBySlug = await getProjectBySlug(input.slug);
    if (existingBySlug) {
      throw new Error(`A project with slug "${input.slug}" already exists.`);
    }
  }

  const row = await adminTablesDB().updateRow<ProjectRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.imageIds !== undefined && { imageIds: input.imageIds }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.published !== undefined && { published: input.published }),
    },
  });

  const project = toProject(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "techProjects",
      recordId: id,
      details: `Updated Jallal Tech project "${project.name}"`,
    });
  }

  return project;
}

export async function deleteProject(
  id: string,
  admin?: { id: string; email: string },
) {
  requireBackend();

  const existing = await getProject(id);
  if (!existing) {
    throw new Error(`Project with id "${id}" not found.`);
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
      module: "techProjects",
      recordId: id,
      details: `Deleted Jallal Tech project "${existing.name}"`,
    });
  }
}
