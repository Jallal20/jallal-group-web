import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import type {
  CourseApplication,
  CourseApplicationStatus,
} from "@/lib/types";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type CourseApplicationRow = Models.Row & {
  courseId: string;
  courseName: string;
  courseSlug: string;
  studentId: string;
  studentUserId: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  country: string;
  district: string;
  address: string;
  dateOfBirth: string | null;
  gender: string;
  highestQualification: string;
  institution: string;
  occupation: string;
  relevantExperience: string;
  deliveryPreference: string;
  courseFee: number;
  currency: string;
  enrollmentDate: string | null;
  whyJoin: string;
  relevantSkills: string;
  additionalInformation: string;
  reference: string;
  status: CourseApplicationStatus;
  paymentStatus: string;
  receiptFileId: string;
  receiptFileName: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
};

function toCourseApplication(row: CourseApplicationRow): CourseApplication {
  return {
    id: row.$id,
    courseId: row.courseId,
    courseName: row.courseName,
    courseSlug: row.courseSlug,
    studentId: row.studentId,
    studentUserId: row.studentUserId,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    whatsappNumber: row.whatsappNumber,
    country: row.country,
    district: row.district,
    address: row.address,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    highestQualification: row.highestQualification,
    institution: row.institution,
    occupation: row.occupation,
    relevantExperience: row.relevantExperience,
    deliveryPreference: row.deliveryPreference,
    courseFee: row.courseFee,
    currency: row.currency,
    enrollmentDate: row.enrollmentDate,
    whyJoin: row.whyJoin,
    relevantSkills: row.relevantSkills,
    additionalInformation: row.additionalInformation,
    reference: row.reference,
    status: row.status,
    paymentStatus: row.paymentStatus as CourseApplication["paymentStatus"],
    receiptFileId: row.receiptFileId,
    receiptFileName: row.receiptFileName,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.courseApplicationsId;

const STATUSES: CourseApplicationStatus[] = [
  "pending-review",
  "under-review",
  "approved",
  "rejected",
  "awaiting-payment",
  "payment-submitted",
  "payment-verified",
  "enrollment-confirmed",
];

export type CourseApplicationFilters = {
  search?: string;
  status?: CourseApplicationStatus;
  paymentStatus?: string;
  courseId?: string;
  studentId?: string;
  limit?: number;
};

export type CourseApplicationInput = {
  courseId: string;
  courseName: string;
  courseSlug: string;
  studentId?: string;
  studentUserId?: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  country?: string;
  district?: string;
  address: string;
  dateOfBirth?: string | null;
  gender?: string;
  highestQualification?: string;
  institution?: string;
  occupation?: string;
  relevantExperience?: string;
  deliveryPreference?: string;
  courseFee: number;
  currency: string;
  enrollmentDate?: string | null;
  whyJoin?: string;
  relevantSkills?: string;
  additionalInformation?: string;
  reference: string;
};

export async function listCourseApplications(
  filters: CourseApplicationFilters = {},
): Promise<{ items: CourseApplication[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.status) {
    queries.push(Query.equal("status", filters.status));
  }
  if (filters.paymentStatus) {
    queries.push(Query.equal("paymentStatus", filters.paymentStatus));
  }
  if (filters.courseId) {
    queries.push(Query.equal("courseId", filters.courseId));
  }
  if (filters.studentId) {
    queries.push(Query.equal("studentId", filters.studentId));
  }

  queries.push(Query.orderDesc("$createdAt"));
  queries.push(Query.limit(Math.min(filters.limit ?? 50, 200)));

  const result = await db.listRows<CourseApplicationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toCourseApplication);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.phone.toLowerCase().includes(q) ||
        a.reference.toLowerCase().includes(q) ||
        a.courseName.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function getCourseApplication(
  id: string,
): Promise<CourseApplication | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<CourseApplicationRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toCourseApplication(row);
  } catch {
    return null;
  }
}

export async function getCourseApplicationByReference(
  reference: string,
): Promise<CourseApplication | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<CourseApplicationRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("reference", reference), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toCourseApplication(result.rows[0]);
  } catch {
    return null;
  }
}

export async function getCourseApplicationsByStudent(
  studentId: string,
): Promise<CourseApplication[]> {
  requireBackend();

  const result = await listCourseApplications({ studentId, limit: 100 });
  return result.items;
}

export async function generateCourseApplicationReference(): Promise<string> {
  requireBackend();

  let reference = "";
  let attempts = 0;

  while (attempts < 20) {
    const suffix = String(
      Math.floor(100000 + Math.random() * 900000),
    );
    reference = `JGA-${suffix}`;
    const existing = await getCourseApplicationByReference(reference);
    if (!existing) break;
    attempts += 1;
  }

  if (!reference) {
    reference = `JGA-${Date.now().toString(36).toUpperCase()}`;
  }

  return reference;
}

export async function createCourseApplication(
  input: CourseApplicationInput,
  admin?: { id: string; email: string },
): Promise<CourseApplication> {
  requireBackend();

  const db = adminTablesDB();

  const existing = await getCourseApplicationByReference(input.reference);
  if (existing) {
    throw new Error(
      `An application with reference "${input.reference}" already exists.`,
    );
  }

  const now = new Date().toISOString();

  const row = await db.createRow<CourseApplicationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      courseId: input.courseId,
      courseName: input.courseName,
      courseSlug: input.courseSlug,
      studentId: input.studentId ?? "",
      studentUserId: input.studentUserId ?? "",
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      whatsappNumber: input.whatsappNumber ?? "",
      country: input.country ?? "",
      district: input.district ?? "",
      address: input.address,
      dateOfBirth: input.dateOfBirth ?? null,
      gender: input.gender ?? "",
      highestQualification: input.highestQualification ?? "",
      institution: input.institution ?? "",
      occupation: input.occupation ?? "",
      relevantExperience: input.relevantExperience ?? "",
      deliveryPreference: input.deliveryPreference ?? "",
      courseFee: input.courseFee,
      currency: input.currency,
      enrollmentDate: input.enrollmentDate ?? null,
      whyJoin: input.whyJoin ?? "",
      relevantSkills: input.relevantSkills ?? "",
      additionalInformation: input.additionalInformation ?? "",
      reference: input.reference,
      status: "pending-review",
      paymentStatus: "none",
      receiptFileId: "",
      receiptFileName: "",
      adminNotes: "",
      createdAt: now,
      updatedAt: now,
    },
  });

  const application = toCourseApplication(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "course_applications",
      recordId: application.id,
      details: `Created course application ${application.reference} for ${application.fullName}`,
    });
  }

  return application;
}

export async function updateCourseApplication(
  id: string,
  input: Partial<CourseApplicationInput>,
  admin?: { id: string; email: string },
): Promise<CourseApplication> {
  requireBackend();

  const existing = await getCourseApplication(id);
  if (!existing) {
    throw new Error(`Course application with id "${id}" not found.`);
  }

  const data: Record<string, unknown> = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.whatsappNumber !== undefined)
    data.whatsappNumber = input.whatsappNumber;
  if (input.country !== undefined) data.country = input.country;
  if (input.district !== undefined) data.district = input.district;
  if (input.address !== undefined) data.address = input.address;
  if (input.dateOfBirth !== undefined)
    data.dateOfBirth = input.dateOfBirth ?? null;
  if (input.gender !== undefined) data.gender = input.gender;
  if (input.highestQualification !== undefined)
    data.highestQualification = input.highestQualification;
  if (input.institution !== undefined) data.institution = input.institution;
  if (input.occupation !== undefined) data.occupation = input.occupation;
  if (input.relevantExperience !== undefined)
    data.relevantExperience = input.relevantExperience;
  if (input.deliveryPreference !== undefined)
    data.deliveryPreference = input.deliveryPreference;
  if (input.courseFee !== undefined) data.courseFee = input.courseFee;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.enrollmentDate !== undefined)
    data.enrollmentDate = input.enrollmentDate ?? null;
  if (input.whyJoin !== undefined) data.whyJoin = input.whyJoin;
  if (input.relevantSkills !== undefined)
    data.relevantSkills = input.relevantSkills;
  if (input.additionalInformation !== undefined)
    data.additionalInformation = input.additionalInformation;

  data.updatedAt = new Date().toISOString();

  const row = await adminTablesDB().updateRow<CourseApplicationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data,
  });

  const application = toCourseApplication(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "course_applications",
      recordId: id,
      details: `Updated course application ${application.reference}`,
    });
  }

  return application;
}

export async function updateCourseApplicationStatus(
  id: string,
  status: CourseApplicationStatus,
  adminNotes: string,
  admin?: { id: string; email: string },
): Promise<CourseApplication> {
  requireBackend();

  const existing = await getCourseApplication(id);
  if (!existing) {
    throw new Error(`Course application with id "${id}" not found.`);
  }

  if (!STATUSES.includes(status)) {
    throw new Error(`Invalid course application status "${status}".`);
  }

  const row = await adminTablesDB().updateRow<CourseApplicationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      status,
      adminNotes,
      updatedAt: new Date().toISOString(),
    },
  });

  const application = toCourseApplication(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update_status",
      module: "course_applications",
      recordId: id,
      details: `Changed course application ${application.reference} status to ${status}`,
    });
  }

  return application;
}

export async function updateCourseApplicationPaymentStatus(
  id: string,
  paymentStatus: "none" | "submitted" | "verified" | "rejected",
  receiptFileId?: string,
  receiptFileName?: string,
): Promise<CourseApplication> {
  requireBackend();

  const existing = await getCourseApplication(id);
  if (!existing) {
    throw new Error(`Course application with id "${id}" not found.`);
  }

  const data: Record<string, unknown> = {
    paymentStatus,
    updatedAt: new Date().toISOString(),
  };

  if (receiptFileId !== undefined) data.receiptFileId = receiptFileId;
  if (receiptFileName !== undefined) data.receiptFileName = receiptFileName;

  const row = await adminTablesDB().updateRow<CourseApplicationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data,
  });

  const application = toCourseApplication(row);

  await writeAuditLog({
    adminId: "system",
    adminEmail: "system@jallalgroup.local",
    action: "update_payment_status",
    module: "course_applications",
    recordId: id,
    details: `Changed application ${application.reference} payment status to ${paymentStatus}`,
  });

  return application;
}

export async function linkCourseApplicationToStudent(
  id: string,
  studentId: string,
  studentUserId: string,
): Promise<CourseApplication> {
  requireBackend();

  const existing = await getCourseApplication(id);
  if (!existing) {
    throw new Error(`Course application with id "${id}" not found.`);
  }

  const row = await adminTablesDB().updateRow<CourseApplicationRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data: {
      studentId,
      studentUserId,
      updatedAt: new Date().toISOString(),
    },
  });

  return toCourseApplication(row);
}

export async function deleteCourseApplication(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getCourseApplication(id);
  if (!existing) {
    throw new Error(`Course application with id "${id}" not found.`);
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
      module: "course_applications",
      recordId: id,
      details: `Deleted course application ${existing.reference} for ${existing.fullName}`,
    });
  }
}

export { STATUSES };
