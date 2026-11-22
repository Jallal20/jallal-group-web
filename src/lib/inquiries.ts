import "server-only";

import { ID, Query, type Models } from "node-appwrite";
import { adminTablesDB } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import type { InquiryStatus, PartnershipInquiry } from "@/lib/types";
import type { PartnershipInquiryInput } from "@/lib/validation";

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

type InquiryRow = Models.Row & {
  fullName: string;
  organization: string;
  email: string;
  phone: string;
  partnershipType: string;
  message: string;
  status: InquiryStatus;
  source: string;
};

const STATUSES: InquiryStatus[] = ["pending", "reviewed", "responded"];

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

function toInquiry(row: InquiryRow): PartnershipInquiry {
  return {
    id: row.$id,
    fullName: row.fullName,
    organization: row.organization,
    email: row.email,
    phone: row.phone,
    partnershipType: row.partnershipType,
    message: row.message,
    status: STATUSES.includes(row.status) ? row.status : "pending",
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

async function hashIp(value: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha256")
    .update(`${value}:${env.apiKey || "jallal"}`)
    .digest("hex")
    .slice(0, 32);
}

export async function createInquiry(
  input: PartnershipInquiryInput,
  context: { ip: string; userAgent: string | null; source: string },
): Promise<{ id: string; duplicate: boolean }> {
  requireBackend();

  const db = adminTablesDB();
  const databaseId = env.databaseId;
  const tableId = env.inquiriesCollectionId;

  // Idempotency: the same email + partnership type within 10 minutes is
  // treated as an accidental duplicate resubmission.
  try {
    const recent = await db.listRows<InquiryRow>({
      databaseId,
      tableId,
      queries: [
        Query.equal("email", input.email),
        Query.equal("partnershipType", input.partnershipType),
        Query.greaterThanEqual(
          "$createdAt",
          new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        ),
        Query.limit(1),
      ],
      total: false,
    });

    if (recent.rows.length > 0) {
      return { id: recent.rows[0].$id, duplicate: true };
    }
  } catch {
    // Duplicate detection is best-effort; never block a legitimate submission.
  }

  const row = await db.createRow({
    databaseId,
    tableId,
    rowId: ID.unique(),
    data: {
      fullName: input.fullName,
      organization: input.organization,
      email: input.email,
      phone: input.phone,
      partnershipType: input.partnershipType,
      message: input.message,
      status: "pending",
      source: context.source,
      ipHash: await hashIp(context.ip),
      userAgent: (context.userAgent ?? "").slice(0, 300),
    },
  });

  return { id: row.$id, duplicate: false };
}

export type InquiryFilters = {
  status?: InquiryStatus | "all";
  partnershipType?: string;
  search?: string;
  limit?: number;
};

export async function listInquiries(
  filters: InquiryFilters = {},
): Promise<{ items: PartnershipInquiry[]; total: number }> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (filters.status && filters.status !== "all") {
    queries.push(Query.equal("status", filters.status));
  }

  if (filters.partnershipType) {
    queries.push(Query.equal("partnershipType", filters.partnershipType));
  }

  queries.push(Query.orderDesc("$createdAt"));
  queries.push(Query.limit(Math.min(filters.limit ?? 200, 200)));

  const result = await db.listRows<InquiryRow>({
    databaseId: env.databaseId,
    tableId: env.inquiriesCollectionId,
    queries,
    total: false,
  });

  const search = filters.search?.trim().toLowerCase() ?? "";
  const all = result.rows.map(toInquiry);

  const items = search
    ? all.filter(
        (item) =>
          item.fullName.toLowerCase().includes(search) ||
          item.organization.toLowerCase().includes(search) ||
          item.email.toLowerCase().includes(search) ||
          item.message.toLowerCase().includes(search) ||
          item.partnershipType.toLowerCase().includes(search),
      )
    : all;

  return { items, total: items.length };
}

export async function getInquiry(id: string): Promise<PartnershipInquiry | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<InquiryRow>({
      databaseId: env.databaseId,
      tableId: env.inquiriesCollectionId,
      rowId: id,
    });
    return toInquiry(row);
  } catch {
    return null;
  }
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<PartnershipInquiry> {
  requireBackend();

  const row = await adminTablesDB().updateRow<InquiryRow>({
    databaseId: env.databaseId,
    tableId: env.inquiriesCollectionId,
    rowId: id,
    data: { status },
  });

  return toInquiry(row);
}

export async function deleteInquiry(id: string): Promise<void> {
  requireBackend();

  await adminTablesDB().deleteRow({
    databaseId: env.databaseId,
    tableId: env.inquiriesCollectionId,
    rowId: id,
  });
}

export async function inquiryStats(): Promise<{
  total: number;
  pending: number;
  reviewed: number;
  responded: number;
}> {
  requireBackend();

  const db = adminTablesDB();
  const databaseId = env.databaseId;
  const tableId = env.inquiriesCollectionId;

  const countByStatus = async (status: InquiryStatus) => {
    try {
      const result = await db.listRows<InquiryRow>({
        databaseId,
        tableId,
        queries: [Query.equal("status", status), Query.limit(1)],
        total: true,
      });
      return result.total ?? 0;
    } catch {
      return 0;
    }
  };

  const [pending, reviewed, responded] = await Promise.all([
    countByStatus("pending"),
    countByStatus("reviewed"),
    countByStatus("responded"),
  ]);

  return {
    total: pending + reviewed + responded,
    pending,
    reviewed,
    responded,
  };
}
