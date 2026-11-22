import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import type { CourseCategory } from "@/lib/types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type CourseCategoryRow = Models.Row & {
  name: string;
  slug: string;
  description: string;
  published: boolean;
};

function toCourseCategory(row: CourseCategoryRow): CourseCategory {
  return {
    id: row.$id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    published: row.published,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.courseCategoriesId;

export type CourseCategoryFilters = {
  search?: string;
  published?: boolean;
  limit?: number;
};

export type CourseCategoryInput = {
  name: string;
  slug: string;
  description: string;
  published: boolean;
};

export async function listCourseCategories(
  filters: CourseCategoryFilters = {},
): Promise<{ items: CourseCategory[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.published !== undefined) {
    queries.push(Query.equal("published", filters.published));
  }

  queries.push(Query.orderAsc("name"));
  queries.push(Query.limit(Math.min(filters.limit ?? 100, 200)));

  const result = await db.listRows<CourseCategoryRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toCourseCategory);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getCourseCategory(id: string): Promise<CourseCategory | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<CourseCategoryRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toCourseCategory(row);
  } catch {
    return null;
  }
}

export async function getCourseCategoryBySlug(slug: string): Promise<CourseCategory | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<CourseCategoryRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("slug", slug), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toCourseCategory(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createCourseCategory(
  input: CourseCategoryInput,
  admin?: { id: string; email: string },
): Promise<CourseCategory> {
  requireBackend();

  const db = adminTablesDB();

  const existing = await getCourseCategoryBySlug(input.slug);
  if (existing) {
    throw new Error(`A course category with slug "${input.slug}" already exists.`);
  }

  const row = await db.createRow<CourseCategoryRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      published: input.published,
    },
  });

  const category = toCourseCategory(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "course-categories",
      recordId: category.id,
      details: `Created course category "${category.name}"`,
    });
  }

  return category;
}

export async function updateCourseCategory(
  id: string,
  input: Partial<CourseCategoryInput>,
  admin?: { id: string; email: string },
): Promise<CourseCategory> {
  requireBackend();

  const existing = await getCourseCategory(id);
  if (!existing) {
    throw new Error(`Course category with id "${id}" not found.`);
  }

  if (input.slug && input.slug !== existing.slug) {
    const existingBySlug = await getCourseCategoryBySlug(input.slug);
    if (existingBySlug) {
      throw new Error(`A course category with slug "${input.slug}" already exists.`);
    }
  }

  const row = await adminTablesDB().updateRow<CourseCategoryRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.published !== undefined && { published: input.published }),
    },
  });

  const category = toCourseCategory(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "course-categories",
      recordId: id,
      details: `Updated course category "${category.name}"`,
    });
  }

  return category;
}

export async function deleteCourseCategory(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getCourseCategory(id);
  if (!existing) {
    throw new Error(`Course category with id "${id}" not found.`);
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
      module: "course-categories",
      recordId: id,
      details: `Deleted course category "${existing.name}"`,
    });
  }
}
