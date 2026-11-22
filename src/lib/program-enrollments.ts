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

export type EnrollmentStatus = "pending" | "active" | "completed" | "suspended" | "withdrawn";

export interface ProgramEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  activityId: string;
  activityTitle: string;
  applicationId: string | null;
  schedule: string;
  instructor: string;
  notes: string;
  status: EnrollmentStatus;
  enrolledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type EnrollmentRow = Models.Row & {
  studentId: string;
  studentName: string;
  studentEmail: string;
  activityId: string;
  activityTitle: string;
  applicationId: string | null;
  schedule: string;
  instructor: string;
  notes: string;
  status: EnrollmentStatus;
  enrolledAt: string | null;
};

function toEnrollment(row: EnrollmentRow): ProgramEnrollment {
  return {
    id: row.$id,
    studentId: row.studentId,
    studentName: row.studentName,
    studentEmail: row.studentEmail,
    activityId: row.activityId,
    activityTitle: row.activityTitle,
    applicationId: row.applicationId,
    schedule: row.schedule,
    instructor: row.instructor,
    notes: row.notes,
    status: row.status,
    enrolledAt: row.enrolledAt,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.programEnrollmentsId;

export type EnrollmentFilters = {
  search?: string;
  status?: EnrollmentStatus;
  activityId?: string;
  studentId?: string;
  limit?: number;
};

export type EnrollmentInput = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  activityId: string;
  activityTitle: string;
  applicationId: string | null;
  schedule: string;
  instructor: string;
  notes: string;
  status: EnrollmentStatus;
};

export async function listProgramEnrollments(
  filters: EnrollmentFilters = {},
): Promise<{ items: ProgramEnrollment[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.status) {
    queries.push(Query.equal("status", filters.status));
  }
  if (filters.activityId) {
    queries.push(Query.equal("activityId", filters.activityId));
  }
  if (filters.studentId) {
    queries.push(Query.equal("studentId", filters.studentId));
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
        e.studentName.toLowerCase().includes(q) ||
        e.studentEmail.toLowerCase().includes(q) ||
        e.activityTitle.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getProgramEnrollment(id: string): Promise<ProgramEnrollment | null> {
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

export async function getEnrollmentsByStudent(
  studentId: string,
): Promise<ProgramEnrollment[]> {
  requireBackend();

  const result = await listProgramEnrollments({ studentId, limit: 100 });
  return result.items;
}

export async function getEnrollmentByApplication(
  applicationId: string,
): Promise<ProgramEnrollment | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<EnrollmentRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("applicationId", applicationId), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toEnrollment(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createProgramEnrollment(
  input: EnrollmentInput,
  admin?: { id: string; email: string },
): Promise<ProgramEnrollment> {
  requireBackend();

  const db = adminTablesDB();
  const row = await db.createRow<EnrollmentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      studentId: input.studentId,
      studentName: input.studentName,
      studentEmail: input.studentEmail,
      activityId: input.activityId,
      activityTitle: input.activityTitle,
      applicationId: input.applicationId ?? null,
      schedule: input.schedule,
      instructor: input.instructor,
      notes: input.notes,
      status: input.status,
      enrolledAt: new Date().toISOString(),
    },
  });

  const enrollment = toEnrollment(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "program_enrollments",
      recordId: enrollment.id,
      details: `Enrolled ${enrollment.studentName} in ${enrollment.activityTitle}`,
    });
  }

  return enrollment;
}

export async function updateProgramEnrollment(
  id: string,
  input: Partial<EnrollmentInput>,
  admin?: { id: string; email: string },
): Promise<ProgramEnrollment> {
  requireBackend();

  const existing = await getProgramEnrollment(id);
  if (!existing) {
    throw new Error(`Enrollment with id "${id}" not found.`);
  }

  const data: Record<string, unknown> = {};
  if (input.studentName !== undefined) data.studentName = input.studentName;
  if (input.studentEmail !== undefined) data.studentEmail = input.studentEmail;
  if (input.schedule !== undefined) data.schedule = input.schedule;
  if (input.instructor !== undefined) data.instructor = input.instructor;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.status !== undefined) data.status = input.status;

  const row = await adminTablesDB().updateRow<EnrollmentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data,
  });

  const enrollment = toEnrollment(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "program_enrollments",
      recordId: id,
      details: `Updated enrollment ${enrollment.id}`,
    });
  }

  return enrollment;
}

export async function deleteProgramEnrollment(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getProgramEnrollment(id);
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
      module: "program_enrollments",
      recordId: id,
      details: `Deleted enrollment ${existing.id}`,
    });
  }
}
