import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import { getApplicationForm } from "@/lib/application-forms";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

export type ApplicationStatus =
  | "submitted"
  | "under-review"
  | "shortlisted"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "withdrawn";

export interface Application {
  id: string;
  activityId: string;
  activityTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  reference: string;
  formData: Record<string, unknown>;
  fileIds: string[];
  status: ApplicationStatus;
  adminNotes: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  decisionMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

type ApplicationRow = Models.Row & {
  activityId: string;
  activityTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  reference: string;
  formData: string;
  fileIds: string;
  status: ApplicationStatus;
  adminNotes: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  decisionMessage: string | null;
};

function toApplication(row: ApplicationRow): Application {
  return {
    id: row.$id,
    activityId: row.activityId,
    activityTitle: row.activityTitle,
    studentId: row.studentId,
    studentName: row.studentName,
    studentEmail: row.studentEmail,
    reference: row.reference,
    formData: safeParseJsonObject(row.formData),
    fileIds: safeParseJsonArray(row.fileIds),
    status: row.status,
    adminNotes: row.adminNotes,
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    decisionMessage: row.decisionMessage,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function safeParseJsonObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function safeParseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.applicationsId;

export type ApplicationFilters = {
  search?: string;
  status?: ApplicationStatus;
  activityId?: string;
  studentId?: string;
  limit?: number;
};

export type ApplicationInput = {
  activityId: string;
  activityTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  reference: string;
  formData: Record<string, unknown>;
  fileIds: string[];
};

export async function listApplications(
  filters: ApplicationFilters = {},
): Promise<{ items: Application[]; total: number }> {
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

  const result = await db.listRows<ApplicationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toApplication);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (a) =>
        a.studentName.toLowerCase().includes(q) ||
        a.studentEmail.toLowerCase().includes(q) ||
        a.reference.toLowerCase().includes(q) ||
        a.activityTitle.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getApplication(id: string): Promise<Application | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<ApplicationRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toApplication(row);
  } catch {
    return null;
  }
}

export async function getApplicationByReference(
  reference: string,
): Promise<Application | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<ApplicationRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("reference", reference), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toApplication(result.rows[0]);
  } catch {
    return null;
  }
}

export async function getApplicationsByStudent(
  studentId: string,
): Promise<Application[]> {
  requireBackend();

  const result = await listApplications({ studentId, limit: 100 });
  return result.items;
}

export async function generateReference(activityId: string): Promise<string> {
  requireBackend();

  const prefix = `JGT-${activityId.slice(0, 4).toUpperCase()}-`;
  let reference = "";
  let attempts = 0;

  while (attempts < 10) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    reference = `${prefix}${suffix}`;
    const existing = await getApplicationByReference(reference);
    if (!existing) break;
    attempts += 1;
  }

  return reference;
}

export async function createApplication(
  input: ApplicationInput,
): Promise<Application> {
  requireBackend();

  const db = adminTablesDB();
  const row = await db.createRow<ApplicationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      activityId: input.activityId,
      activityTitle: input.activityTitle,
      studentId: input.studentId,
      studentName: input.studentName,
      studentEmail: input.studentEmail,
      reference: input.reference,
      formData: JSON.stringify(input.formData),
      fileIds: JSON.stringify(input.fileIds),
      status: "submitted",
      adminNotes: "",
      reviewedBy: null,
      reviewedAt: null,
      decisionMessage: null,
    },
  });

  return toApplication(row);
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  adminNotes: string,
  decisionMessage: string | null,
  admin: { id: string; email: string },
): Promise<Application> {
  requireBackend();

  const existing = await getApplication(id);
  if (!existing) {
    throw new Error(`Application with id "${id}" not found.`);
  }

  const validStatuses: ApplicationStatus[] = [
    "submitted",
    "under-review",
    "shortlisted",
    "approved",
    "rejected",
    "waitlisted",
    "withdrawn",
  ];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid application status "${status}".`);
  }

  const row = await adminTablesDB().updateRow<ApplicationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      status,
      adminNotes,
      reviewedBy: admin.id,
      reviewedAt: new Date().toISOString(),
      decisionMessage: decisionMessage ?? null,
    },
  });

  const application = toApplication(row);

  await writeAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "update_status",
    module: "applications",
    recordId: id,
    details: `Changed application ${application.reference} status to ${status}`,
  });

  return application;
}

export async function updateApplication(
  id: string,
  input: {
    formData?: Record<string, unknown>;
    fileIds?: string[];
    status?: ApplicationStatus;
  },
  admin?: { id: string; email: string },
): Promise<Application> {
  requireBackend();

  const existing = await getApplication(id);
  if (!existing) {
    throw new Error(`Application with id "${id}" not found.`);
  }

  const data: Record<string, unknown> = {};
  if (input.formData !== undefined) data.formData = JSON.stringify(input.formData);
  if (input.fileIds !== undefined) data.fileIds = JSON.stringify(input.fileIds);
  if (input.status !== undefined) data.status = input.status;

  const row = await adminTablesDB().updateRow<ApplicationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data,
  });

  const application = toApplication(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "applications",
      recordId: id,
      details: `Updated application ${application.reference}`,
    });
  }

  return application;
}

export async function deleteApplication(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getApplication(id);
  if (!existing) {
    throw new Error(`Application with id "${id}" not found.`);
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
      module: "applications",
      recordId: id,
      details: `Deleted application ${existing.reference}`,
    });
  }
}

export async function applicationStats(activityId?: string): Promise<{
  total: number;
  submitted: number;
  underReview: number;
  shortlisted: number;
  approved: number;
  rejected: number;
  waitlisted: number;
  withdrawn: number;
}> {
  requireBackend();

  const all = await listApplications(activityId ? { activityId, limit: 1000 } : { limit: 1000 });
  const items = all.items;

  const count = (status: ApplicationStatus) =>
    items.filter((a) => a.status === status).length;

  return {
    total: items.length,
    submitted: count("submitted"),
    underReview: count("under-review"),
    shortlisted: count("shortlisted"),
    approved: count("approved"),
    rejected: count("rejected"),
    waitlisted: count("waitlisted"),
    withdrawn: count("withdrawn"),
  };
}

