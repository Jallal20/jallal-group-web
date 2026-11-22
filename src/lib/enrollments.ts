import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import type { Enrollment, EnrollmentStatus } from "@/lib/types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type EnrollmentRow = Models.Row & {
  courseId: string;
  courseName: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  dateOfBirth: string | null;
  gender: string;
  address: string;
  educationBackground: string;
  relevantExperience: string;
  additionalInformation: string;
  status: EnrollmentStatus;
  adminNotes: string;
  reference: string;
};

function toEnrollment(row: EnrollmentRow): Enrollment {
  return {
    id: row.$id,
    courseId: row.courseId,
    courseName: row.courseName,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    whatsappNumber: row.whatsappNumber,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    address: row.address,
    educationBackground: row.educationBackground,
    relevantExperience: row.relevantExperience,
    additionalInformation: row.additionalInformation,
    status: row.status,
    adminNotes: row.adminNotes,
    reference: row.reference,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.enrollmentsId;

export type EnrollmentFilters = {
  search?: string;
  status?: EnrollmentStatus;
  courseId?: string;
  limit?: number;
};

export type EnrollmentInput = {
  courseId: string;
  courseName: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  dateOfBirth: string | null;
  gender: string;
  address: string;
  educationBackground: string;
  relevantExperience: string;
  additionalInformation: string;
  reference: string;
};

const STATUSES: EnrollmentStatus[] = [
  "pending",
  "under-review",
  "accepted",
  "rejected",
  "enrolled",
];

export async function listEnrollments(
  filters: EnrollmentFilters = {},
): Promise<{ items: Enrollment[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.status) {
    queries.push(Query.equal("status", filters.status));
  }
  if (filters.courseId) {
    queries.push(Query.equal("courseId", filters.courseId));
  }

  queries.push(Query.orderDesc("$createdAt"));
  queries.push(Query.limit(Math.min(filters.limit ?? 50, 200)));

  const result = await db.listRows<EnrollmentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toEnrollment);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.courseName.toLowerCase().includes(q) ||
        e.reference.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getEnrollment(id: string): Promise<Enrollment | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<EnrollmentRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toEnrollment(row);
  } catch {
    return null;
  }
}

export async function getEnrollmentByReference(reference: string): Promise<Enrollment | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<EnrollmentRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("reference", reference), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toEnrollment(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createEnrollment(
  input: EnrollmentInput,
  admin?: { id: string; email: string },
): Promise<Enrollment> {
  requireBackend();

  const db = adminTablesDB();

  // Prevent duplicate reference
  const existing = await getEnrollmentByReference(input.reference);
  if (existing) {
    throw new Error(`An enrollment with reference "${input.reference}" already exists.`);
  }

  const row = await db.createRow<EnrollmentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      courseId: input.courseId,
      courseName: input.courseName,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      whatsappNumber: input.whatsappNumber,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      address: input.address,
      educationBackground: input.educationBackground,
      relevantExperience: input.relevantExperience,
      additionalInformation: input.additionalInformation,
      status: "pending",
      adminNotes: "",
      reference: input.reference,
    },
  });

  const enrollment = toEnrollment(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "enrollments",
      recordId: enrollment.id,
      details: `Created enrollment ${enrollment.reference} for ${enrollment.fullName}`,
    });
  }

  return enrollment;
}

export async function updateEnrollmentStatus(
  id: string,
  status: EnrollmentStatus,
  adminNotes: string,
  admin?: { id: string; email: string },
): Promise<Enrollment> {
  requireBackend();

  const existing = await getEnrollment(id);
  if (!existing) {
    throw new Error(`Enrollment with id "${id}" not found.`);
  }

  if (!STATUSES.includes(status)) {
    throw new Error(`Invalid enrollment status "${status}".`);
  }

  const row = await adminTablesDB().updateRow<EnrollmentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: { status, adminNotes },
  });

  const enrollment = toEnrollment(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update_status",
      module: "enrollments",
      recordId: id,
      details: `Changed enrollment ${enrollment.reference} status to ${status}`,
    });
  }

  return enrollment;
}

export async function deleteEnrollment(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getEnrollment(id);
  if (!existing) {
    throw new Error(`Enrollment with id "${id}" not found.`);
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
      module: "enrollments",
      recordId: id,
      details: `Deleted enrollment ${existing.reference} for ${existing.fullName}`,
    });
  }
}

export { STATUSES };
