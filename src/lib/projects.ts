import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import type { ShowcaseContentType, ShowcaseStatus } from "@/lib/types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type ProjectRow = Models.Row & {
  title: string;
  slug: string;
  type: string;
  category: string;
  status: string;
  companyId: string;
  companyName: string;
  description: string;
  objectives: string;
  coverImageId: string;
  eventDate: string | null;
  endDate: string | null;
  location: string;
  online: boolean;
  registrationUrl: string;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  progress: number;
  featured: boolean;
  displayOrder: number;
  published: boolean;
  publishedAt: string | null;
  activityId: string;
  createdAt: string;
  updatedAt: string;
};

function toProject(row: ProjectRow) {
  return {
    id: row.$id,
    title: row.title,
    slug: row.slug,
    type: row.type as ShowcaseContentType,
    category: row.category,
    status: row.status as ShowcaseStatus,
    companyId: row.companyId,
    companyName: row.companyName,
    description: row.description,
    objectives: row.objectives,
    coverImageId: row.coverImageId,
    eventDate: row.eventDate,
    endDate: row.endDate,
    location: row.location,
    online: row.online,
    registrationUrl: row.registrationUrl,
    registrationOpenAt: row.registrationOpenAt,
    registrationCloseAt: row.registrationCloseAt,
    progress: row.progress,
    featured: row.featured,
    displayOrder: row.displayOrder,
    published: row.published,
    publishedAt: row.publishedAt,
    activityId: row.activityId,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = "projects";

export type ProjectFilters = {
  search?: string;
  status?: string;
  type?: string;
  category?: string;
  published?: boolean;
  featured?: boolean;
  limit?: number;
};

export type ProjectInput = {
  title: string;
  slug: string;
  type: string;
  category: string;
  status: string;
  companyId: string;
  companyName: string;
  description: string;
  objectives: string;
  coverImageId: string;
  eventDate: string | null;
  endDate: string | null;
  location: string;
  online: boolean;
  registrationUrl: string;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  progress: number;
  featured: boolean;
  displayOrder: number;
  published: boolean;
  publishedAt: string | null;
  activityId: string;
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
  if (filters.type) {
    queries.push(Query.equal("type", filters.type));
  }
  if (filters.category) {
    queries.push(Query.equal("category", filters.category));
  }
  if (filters.published !== undefined) {
    queries.push(Query.equal("published", filters.published));
  }
  if (filters.featured !== undefined) {
    queries.push(Query.equal("featured", filters.featured));
  }

  queries.push(Query.orderAsc("displayOrder"));
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
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function listHomepageProjects(limit = 6) {
  requireBackend();

  const db = adminTablesDB();
  const result = await db.listRows<ProjectRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries: [
      Query.equal("published", true),
      Query.orderAsc("displayOrder"),
      Query.limit(Math.min(limit, 50)),
    ],
    total: true,
  });

  const items = result.rows.map(toProject);
  const featured = items.filter((item) => item.featured);
  const rest = items.filter((item) => !item.featured);
  return { items: [...featured, ...rest], featured, total: result.total ?? items.length };
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
      title: input.title,
      slug: input.slug,
      type: input.type,
      category: input.category,
      status: input.status,
      companyId: input.companyId,
      companyName: input.companyName,
      description: input.description,
      objectives: input.objectives,
      coverImageId: input.coverImageId,
      eventDate: input.eventDate,
      endDate: input.endDate,
      location: input.location,
      online: input.online,
      registrationUrl: input.registrationUrl,
      registrationOpenAt: input.registrationOpenAt,
      registrationCloseAt: input.registrationCloseAt,
      progress: input.progress,
      featured: input.featured,
      displayOrder: input.displayOrder,
      published: input.published,
      publishedAt:
        input.publishedAt ?? (input.published ? new Date().toISOString() : null),
      activityId: input.activityId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  const project = toProject(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "projects",
      recordId: project.id,
      details: `Created ${project.type} "${project.title}"`,
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
      ...(input.title !== undefined && { title: input.title }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.companyId !== undefined && { companyId: input.companyId }),
      ...(input.companyName !== undefined && { companyName: input.companyName }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.objectives !== undefined && { objectives: input.objectives }),
      ...(input.coverImageId !== undefined && { coverImageId: input.coverImageId }),
      ...(input.eventDate !== undefined && { eventDate: input.eventDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.online !== undefined && { online: input.online }),
      ...(input.registrationUrl !== undefined && { registrationUrl: input.registrationUrl }),
      ...(input.registrationOpenAt !== undefined && { registrationOpenAt: input.registrationOpenAt }),
      ...(input.registrationCloseAt !== undefined && { registrationCloseAt: input.registrationCloseAt }),
      ...(input.progress !== undefined && { progress: input.progress }),
      ...(input.featured !== undefined && { featured: input.featured }),
      ...(input.displayOrder !== undefined && { displayOrder: input.displayOrder }),
      ...(input.published !== undefined && { published: input.published }),
      ...(input.publishedAt !== undefined && { publishedAt: input.publishedAt }),
      ...(input.activityId !== undefined && { activityId: input.activityId }),
      updatedAt: new Date().toISOString(),
    },
  });

  const project = toProject(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "projects",
      recordId: id,
      details: `Updated ${project.type} "${project.title}"`,
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

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete",
      module: "projects",
      recordId: id,
      details: `Deleted ${existing.type} "${existing.title}"`,
    });
  }
}