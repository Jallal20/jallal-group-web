import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import type { CoursePayment, PaymentStatus } from "@/lib/types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type CoursePaymentRow = Models.Row & {
  applicationId: string;
  courseId: string;
  courseName: string;
  studentEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string | null;
  receiptFileId: string;
  receiptFileName: string;
  status: PaymentStatus;
  rejectionReason: string;
  verifiedBy: string;
  verifiedByEmail: string;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toCoursePayment(row: CoursePaymentRow): CoursePayment {
  return {
    id: row.$id,
    applicationId: row.applicationId,
    courseId: row.courseId,
    courseName: row.courseName,
    studentEmail: row.studentEmail,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.paymentMethod,
    transactionReference: row.transactionReference,
    paymentDate: row.paymentDate,
    receiptFileId: row.receiptFileId,
    receiptFileName: row.receiptFileName,
    status: row.status,
    rejectionReason: row.rejectionReason,
    verifiedBy: row.verifiedBy,
    verifiedByEmail: row.verifiedByEmail,
    verifiedAt: row.verifiedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = "course_payments";

const STATUSES: PaymentStatus[] = ["submitted", "verified", "rejected"];

export type CoursePaymentFilters = {
  search?: string;
  status?: PaymentStatus;
  courseId?: string;
  applicationId?: string;
  limit?: number;
};

export type CoursePaymentInput = {
  applicationId: string;
  courseId: string;
  courseName: string;
  studentEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionReference: string;
  paymentDate?: string | null;
  receiptFileId: string;
  receiptFileName: string;
};

export async function listCoursePayments(
  filters: CoursePaymentFilters = {},
): Promise<{ items: CoursePayment[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.status) {
    queries.push(Query.equal("status", filters.status));
  }
  if (filters.courseId) {
    queries.push(Query.equal("courseId", filters.courseId));
  }
  if (filters.applicationId) {
    queries.push(Query.equal("applicationId", filters.applicationId));
  }

  queries.push(Query.orderDesc("$createdAt"));
  queries.push(Query.limit(Math.min(filters.limit ?? 50, 200)));

  const result = await db.listRows<CoursePaymentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toCoursePayment);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.studentEmail.toLowerCase().includes(q) ||
        p.transactionReference.toLowerCase().includes(q) ||
        p.courseName.toLowerCase().includes(q) ||
        p.applicationId.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getCoursePayment(id: string): Promise<CoursePayment | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<CoursePaymentRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toCoursePayment(row);
  } catch {
    return null;
  }
}

export async function getCoursePaymentByApplication(
  applicationId: string,
): Promise<CoursePayment | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<CoursePaymentRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [
        Query.equal("applicationId", applicationId),
        Query.orderDesc("$createdAt"),
        Query.limit(1),
      ],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toCoursePayment(result.rows[0]);
  } catch {
    return null;
  }
}

export async function createCoursePayment(
  input: CoursePaymentInput,
  admin?: { id: string; email: string },
): Promise<CoursePayment> {
  requireBackend();

  const db = adminTablesDB();
  const now = new Date().toISOString();

  const row = await db.createRow<CoursePaymentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      applicationId: input.applicationId,
      courseId: input.courseId,
      courseName: input.courseName,
      studentEmail: input.studentEmail,
      amount: input.amount,
      currency: input.currency,
      paymentMethod: input.paymentMethod,
      transactionReference: input.transactionReference,
      paymentDate: input.paymentDate ?? null,
      receiptFileId: input.receiptFileId,
      receiptFileName: input.receiptFileName,
      status: "submitted",
      rejectionReason: "",
      verifiedBy: "",
      verifiedByEmail: "",
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
    },
  });

  const payment = toCoursePayment(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "course_payments",
      recordId: payment.id,
      details: `Created payment record for application ${payment.applicationId}`,
    });
  }

  return payment;
}

export async function verifyCoursePayment(
  id: string,
  admin: { id: string; email: string },
  notes?: string,
): Promise<CoursePayment> {
  requireBackend();

  const existing = await getCoursePayment(id);
  if (!existing) {
    throw new Error(`Course payment with id "${id}" not found.`);
  }

  const row = await adminTablesDB().updateRow<CoursePaymentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      status: "verified",
      verifiedBy: admin.id,
      verifiedByEmail: admin.email,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  const payment = toCoursePayment(row);

  await writeAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "verify",
    module: "course_payments",
    recordId: id,
    details: `Verified payment for application ${payment.applicationId}`,
  });

  return payment;
}

export async function rejectCoursePayment(
  id: string,
  admin: { id: string; email: string },
  reason: string,
): Promise<CoursePayment> {
  requireBackend();

  const existing = await getCoursePayment(id);
  if (!existing) {
    throw new Error(`Course payment with id "${id}" not found.`);
  }

  const row = await adminTablesDB().updateRow<CoursePaymentRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      status: "rejected",
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    },
  });

  const payment = toCoursePayment(row);

  await writeAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "reject",
    module: "course_payments",
    recordId: id,
    details: `Rejected payment for application ${payment.applicationId}`,
  });

  return payment;
}

export async function deleteCoursePayment(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getCoursePayment(id);
  if (!existing) {
    throw new Error(`Course payment with id "${id}" not found.`);
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
      module: "course_payments",
      recordId: id,
      details: `Deleted payment record ${existing.id}`,
    });
  }
}

export { STATUSES };
