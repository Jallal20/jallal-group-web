import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import type { Course, CourseStatus, CourseDeliveryMethod } from "@/lib/types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type CourseRow = Models.Row & {
  name: string;
  code: string;
  slug: string;
  category: string;
  description: string;
  objectives: string;
  duration: string;
  fee: number;
  currency: string;
  requirements: string;
  imageId: string;
  capacity: number;
  status: CourseStatus;
  published: boolean;
  deliveryMethod: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  enrollmentOpensAt: string | null;
  enrollmentClosesAt: string | null;
  instructorName: string;
  instructorBio: string;
  instructorEmail: string;
  curriculum: string;
  paymentInstructions: string;
  paymentMethods: string;
  isFree: boolean;
};

function toCourse(row: CourseRow): Course {
  return {
    id: row.$id,
    name: row.name,
    code: row.code,
    slug: row.slug,
    category: row.category,
    description: row.description,
    objectives: row.objectives,
    duration: row.duration,
    fee: row.fee,
    currency: row.currency,
    requirements: row.requirements,
    imageId: row.imageId,
    capacity: row.capacity,
    status: row.status,
    published: row.published,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
    deliveryMethod: (row.deliveryMethod ?? "Physical") as CourseDeliveryMethod,
    location: row.location ?? "",
    startDate: row.startDate ?? null,
    endDate: row.endDate ?? null,
    enrollmentOpensAt: row.enrollmentOpensAt ?? null,
    enrollmentClosesAt: row.enrollmentClosesAt ?? null,
    instructorName: row.instructorName,
    instructorBio: row.instructorBio,
    instructorEmail: row.instructorEmail,
    curriculum: row.curriculum,
    paymentInstructions: row.paymentInstructions,
    paymentMethods: row.paymentMethods,
    isFree: row.isFree,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.coursesId;

export type CourseFilters = {
  search?: string;
  status?: CourseStatus;
  category?: string;
  published?: boolean;
  limit?: number;
};

export type CourseInput = {
  name: string;
  code: string;
  slug?: string;
  category: string;
  description: string;
  objectives: string;
  duration: string;
  fee: number;
  currency: string;
  requirements: string;
  imageId: string;
  capacity: number;
  status: CourseStatus;
  published: boolean;
  deliveryMethod?: string;
  location?: string;
  startDate?: string | null;
  endDate?: string | null;
  enrollmentOpensAt?: string | null;
  enrollmentClosesAt?: string | null;
  instructorName?: string;
  instructorBio?: string;
  instructorEmail?: string;
  curriculum?: string;
  paymentInstructions?: string;
  paymentMethods?: string;
  isFree?: boolean;
};

export async function listCourses(
  filters: CourseFilters = {},
): Promise<{ items: Course[]; total: number }> {
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

  queries.push(Query.orderAsc("code"));
  queries.push(Query.limit(Math.min(filters.limit ?? 50, 200)));

  const result = await db.listRows<CourseRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toCourse);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getCourse(id: string): Promise<Course | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<CourseRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toCourse(row);
  } catch {
    return null;
  }
}

export async function getCourseByCode(code: string): Promise<Course | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<CourseRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("code", code), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toCourse(result.rows[0]);
  } catch {
    return null;
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<CourseRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("slug", slug), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toCourse(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createCourse(
  input: CourseInput,
  admin?: { id: string; email: string },
): Promise<Course> {
  requireBackend();

  const db = adminTablesDB();

  const existing = await getCourseByCode(input.code);
  if (existing) {
    throw new Error(`A course with code "${input.code}" already exists.`);
  }

  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const row = await db.createRow<CourseRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      name: input.name,
      code: input.code,
      slug,
      category: input.category,
      description: input.description,
      objectives: input.objectives,
      duration: input.duration,
      fee: input.fee,
      currency: input.currency,
      requirements: input.requirements,
      imageId: input.imageId,
      capacity: input.capacity,
      status: input.status,
      published: input.published,
      deliveryMethod: input.deliveryMethod ?? "Physical",
      location: input.location ?? "",
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      enrollmentOpensAt: input.enrollmentOpensAt ?? null,
      enrollmentClosesAt: input.enrollmentClosesAt ?? null,
      instructorName: input.instructorName ?? "",
      instructorBio: input.instructorBio ?? "",
      instructorEmail: input.instructorEmail ?? "",
      curriculum: input.curriculum ?? "[]",
      paymentInstructions: input.paymentInstructions ?? "",
      paymentMethods: input.paymentMethods ?? "[]",
      isFree: input.isFree ?? false,
    },
  });

  const course = toCourse(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "courses",
      recordId: course.id,
      details: `Created course "${course.name}" (${course.code})`,
    });
  }

  return course;
}

export async function updateCourse(
  id: string,
  input: Partial<CourseInput>,
  admin?: { id: string; email: string },
): Promise<Course> {
  requireBackend();

  const existing = await getCourse(id);
  if (!existing) {
    throw new Error(`Course with id "${id}" not found.`);
  }

  if (input.code && input.code !== existing.code) {
    const existingByCode = await getCourseByCode(input.code);
    if (existingByCode) {
      throw new Error(`A course with code "${input.code}" already exists.`);
    }
  }

  const row = await adminTablesDB().updateRow<CourseRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.code !== undefined && { code: input.code }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.objectives !== undefined && { objectives: input.objectives }),
      ...(input.duration !== undefined && { duration: input.duration }),
      ...(input.fee !== undefined && { fee: input.fee }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.requirements !== undefined && { requirements: input.requirements }),
      ...(input.imageId !== undefined && { imageId: input.imageId }),
      ...(input.capacity !== undefined && { capacity: input.capacity }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.published !== undefined && { published: input.published }),
      ...(input.deliveryMethod !== undefined && { deliveryMethod: input.deliveryMethod }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.enrollmentOpensAt !== undefined && {
        enrollmentOpensAt: input.enrollmentOpensAt,
      }),
      ...(input.enrollmentClosesAt !== undefined && {
        enrollmentClosesAt: input.enrollmentClosesAt,
      }),
      ...(input.instructorName !== undefined && {
        instructorName: input.instructorName,
      }),
      ...(input.instructorBio !== undefined && { instructorBio: input.instructorBio }),
      ...(input.instructorEmail !== undefined && {
        instructorEmail: input.instructorEmail,
      }),
      ...(input.curriculum !== undefined && { curriculum: input.curriculum }),
      ...(input.paymentInstructions !== undefined && {
        paymentInstructions: input.paymentInstructions,
      }),
      ...(input.paymentMethods !== undefined && {
        paymentMethods: input.paymentMethods,
      }),
      ...(input.isFree !== undefined && { isFree: input.isFree }),
    },
  });

  const course = toCourse(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "courses",
      recordId: id,
      details: `Updated course "${course.name}"`,
    });
  }

  return course;
}

export async function deleteCourse(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getCourse(id);
  if (!existing) {
    throw new Error(`Course with id "${id}" not found.`);
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
      module: "courses",
      recordId: id,
      details: `Deleted course "${existing.name}"`,
    });
  }
}
