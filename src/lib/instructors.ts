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

export type InstructorStatus = "active" | "inactive";

export interface Instructor {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  expertise: string;
  status: InstructorStatus;
  createdAt: string;
  updatedAt: string;
}

type InstructorRow = Models.Row & {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  expertise: string;
  status: InstructorStatus;
};

function toInstructor(row: InstructorRow): Instructor {
  return {
    id: row.$id,
    userId: row.userId,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    bio: row.bio,
    expertise: row.expertise,
    status: row.status,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.instructorsId;

export type InstructorInput = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  expertise: string;
  status: InstructorStatus;
};

export async function listInstructors(): Promise<Instructor[]> {
  requireBackend();

  const db = adminTablesDB();
  const result = await db.listRows<InstructorRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries: [Query.orderDesc("$createdAt"), Query.limit(100)],
    total: false,
  });
  return result.rows.map(toInstructor);
}

export async function getInstructor(id: string): Promise<Instructor | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<InstructorRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toInstructor(row);
  } catch {
    return null;
  }
}

export async function createInstructor(
  input: InstructorInput,
  admin?: { id: string; email: string },
): Promise<Instructor> {
  requireBackend();

  const db = adminTablesDB();
  const row = await db.createRow<InstructorRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      userId: input.userId,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      bio: input.bio,
      expertise: input.expertise,
      status: input.status,
    },
  });

  const instructor = toInstructor(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "instructors",
      recordId: instructor.id,
      details: `Created instructor ${instructor.fullName}`,
    });
  }

  return instructor;
}

export async function updateInstructor(
  id: string,
  input: Partial<InstructorInput>,
  admin?: { id: string; email: string },
): Promise<Instructor> {
  requireBackend();

  const existing = await getInstructor(id);
  if (!existing) {
    throw new Error(`Instructor with id "${id}" not found.`);
  }

  const data: Record<string, unknown> = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.expertise !== undefined) data.expertise = input.expertise;
  if (input.status !== undefined) data.status = input.status;

  const row = await adminTablesDB().updateRow<InstructorRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data,
  });

  const instructor = toInstructor(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "instructors",
      recordId: id,
      details: `Updated instructor ${instructor.fullName}`,
    });
  }

  return instructor;
}

export async function deleteInstructor(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getInstructor(id);
  if (!existing) {
    throw new Error(`Instructor with id "${id}" not found.`);
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
      module: "instructors",
      recordId: id,
      details: `Deleted instructor ${existing.fullName}`,
    });
  }
}
