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

export type StudentStatus = "active" | "suspended" | "inactive";

export interface Student {
  id: string;
  userId: string;
  studentId: string;
  email: string;
  fullName: string;
  phone: string;
  dateOfBirth: string | null;
  gender: string;
  address: string;
  institution: string;
  educationalLevel: string;
  courseOfStudy: string;
  status: StudentStatus;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type StudentRow = Models.Row & {
  userId: string;
  studentId: string;
  email: string;
  fullName: string;
  phone: string;
  dateOfBirth: string | null;
  gender: string;
  address: string;
  institution: string;
  educationalLevel: string;
  courseOfStudy: string;
  status: StudentStatus;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
};

function toStudent(row: StudentRow): Student {
  return {
    id: row.$id,
    userId: row.userId,
    studentId: row.studentId,
    email: row.email,
    fullName: row.fullName,
    phone: row.phone,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    address: row.address,
    institution: row.institution,
    educationalLevel: row.educationalLevel,
    courseOfStudy: row.courseOfStudy,
    status: row.status,
    emailVerified: row.emailVerified,
    emailVerifiedAt: row.emailVerifiedAt,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.studentsId;

export type StudentFilters = {
  search?: string;
  status?: StudentStatus;
  limit?: number;
};

export type StudentInput = {
  userId: string;
  studentId: string;
  email: string;
  fullName: string;
  phone: string;
  dateOfBirth: string | null;
  gender: string;
  address: string;
  institution: string;
  educationalLevel: string;
  courseOfStudy: string;
  status: StudentStatus;
  emailVerified: boolean;
};

export async function listStudents(
  filters: StudentFilters = {},
): Promise<{ items: Student[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.status) {
    queries.push(Query.equal("status", filters.status));
  }

  queries.push(Query.orderDesc("$createdAt"));
  queries.push(Query.limit(Math.min(filters.limit ?? 50, 200)));

  const result = await db.listRows<StudentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toStudent);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getStudent(id: string): Promise<Student | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<StudentRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toStudent(row);
  } catch {
    return null;
  }
}

export async function getStudentByUserId(userId: string): Promise<Student | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<StudentRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("userId", userId), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toStudent(result.rows[0]);
  } catch {
    return null;
  }
}

export async function getStudentByStudentId(studentId: string): Promise<Student | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<StudentRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("studentId", studentId), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toStudent(result.rows[0]);
  } catch {
    return null;
  }
}

export async function generateStudentId(): Promise<string> {
  requireBackend();

  const year = new Date().getFullYear();
  const prefix = `JGT-${year}-`;
  let attempts = 0;

  while (attempts < 20) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const candidate = `${prefix}${suffix}`;
    const existing = await getStudentByStudentId(candidate);
    if (!existing) return candidate;
    attempts += 1;
  }

  // Fallback: unique counter based
  const result = await adminTablesDB().listRows<StudentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries: [Query.limit(1)],
    total: true,
  });
  const next = (result.total ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createStudent(
  input: StudentInput,
  admin?: { id: string; email: string },
): Promise<Student> {
  requireBackend();

  if (await getStudentByUserId(input.userId)) {
    throw new Error(`A student record already exists for user ${input.userId}.`);
  }

  const db = adminTablesDB();
  const row = await db.createRow<StudentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      userId: input.userId,
      studentId: input.studentId,
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth ?? null,
      gender: input.gender,
      address: input.address,
      institution: input.institution,
      educationalLevel: input.educationalLevel,
      courseOfStudy: input.courseOfStudy,
      status: input.status,
      emailVerified: input.emailVerified,
      emailVerifiedAt: input.emailVerified ? new Date().toISOString() : null,
    },
  });

  const student = toStudent(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "students",
      recordId: student.id,
      details: `Created student ${student.studentId} (${student.fullName})`,
    });
  }

  return student;
}

export async function updateStudent(
  id: string,
  input: Partial<StudentInput>,
  admin?: { id: string; email: string },
): Promise<Student> {
  requireBackend();

  const existing = await getStudent(id);
  if (!existing) {
    throw new Error(`Student with id "${id}" not found.`);
  }

  const data: Record<string, unknown> = {};
  if (input.email !== undefined) data.email = input.email;
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.dateOfBirth !== undefined) data.dateOfBirth = input.dateOfBirth ?? null;
  if (input.gender !== undefined) data.gender = input.gender;
  if (input.address !== undefined) data.address = input.address;
  if (input.institution !== undefined) data.institution = input.institution;
  if (input.educationalLevel !== undefined)
    data.educationalLevel = input.educationalLevel;
  if (input.courseOfStudy !== undefined) data.courseOfStudy = input.courseOfStudy;
  if (input.status !== undefined) data.status = input.status;
  if (input.emailVerified !== undefined) {
    data.emailVerified = input.emailVerified;
    data.emailVerifiedAt = input.emailVerified ? new Date().toISOString() : null;
  }

  const row = await adminTablesDB().updateRow<StudentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data,
  });

  const student = toStudent(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "students",
      recordId: id,
      details: `Updated student ${student.studentId}`,
    });
  }

  return student;
}

export async function setStudentStatus(
  id: string,
  status: StudentStatus,
  admin: { id: string; email: string },
): Promise<Student> {
  return updateStudent(id, { status }, admin);
}

export async function deleteStudent(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getStudent(id);
  if (!existing) {
    throw new Error(`Student with id "${id}" not found.`);
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
      module: "students",
      recordId: id,
      details: `Deleted student ${existing.studentId}`,
    });
  }
}
