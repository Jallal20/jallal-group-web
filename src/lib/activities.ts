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

export type ActivityStatus = "draft" | "scheduled" | "published" | "archived";

export type VenueType = "physical" | "online" | "hybrid";

export interface Activity {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  objectives: string;
  eligibility: string;
  venue: string;
  venueType: VenueType;
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  duration: string;
  applicationOpensAt: string | null;
  applicationDeadline: string | null;
  totalSlots: number;
  fee: number;
  currency: string;
  isFree: boolean;
  applicationsEnabled: boolean;
  posterImageId: string;
  imageIds: string[];
  organizer: string;
  status: ActivityStatus;
  publishAt: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

type ActivityRow = Models.Row & {
  title: string;
  slug: string;
  category: string;
  description: string;
  objectives: string;
  eligibility: string;
  venue: string;
  venueType: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  duration: string;
  applicationOpensAt: string | null;
  applicationDeadline: string | null;
  totalSlots: number;
  fee: number;
  currency: string;
  isFree: boolean;
  applicationsEnabled: boolean;
  posterImageId: string;
  imageIds: string;
  organizer: string;
  status: ActivityStatus;
  publishAt: string | null;
  published: boolean;
};

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.$id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    description: row.description,
    objectives: row.objectives,
    eligibility: row.eligibility,
    venue: row.venue,
    venueType: row.venueType as VenueType,
    startDate: row.startDate,
    endDate: row.endDate,
    startTime: row.startTime,
    endTime: row.endTime,
    duration: row.duration,
    applicationOpensAt: row.applicationOpensAt,
    applicationDeadline: row.applicationDeadline,
    totalSlots: row.totalSlots,
    fee: row.fee,
    currency: row.currency,
    isFree: row.isFree,
    applicationsEnabled: row.applicationsEnabled,
    posterImageId: row.posterImageId,
    imageIds: safeParseJsonArray(row.imageIds),
    organizer: row.organizer,
    status: row.status,
    publishAt: row.publishAt,
    published: row.published,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
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

const TABLE_ID = env.activitiesId;

export type ActivityFilters = {
  search?: string;
  status?: ActivityStatus;
  category?: string;
  published?: boolean;
  limit?: number;
};

export type ActivityInput = {
  title: string;
  slug: string;
  category: string;
  description: string;
  objectives: string;
  eligibility: string;
  venue: string;
  venueType: VenueType;
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  duration: string;
  applicationOpensAt: string | null;
  applicationDeadline: string | null;
  totalSlots: number;
  fee: number;
  currency: string;
  isFree: boolean;
  applicationsEnabled: boolean;
  posterImageId: string;
  imageIds: string[];
  organizer: string;
  status: ActivityStatus;
  publishAt: string | null;
  published: boolean;
};

export async function listActivities(
  filters: ActivityFilters = {},
): Promise<{ items: Activity[]; total: number }> {
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

  queries.push(Query.orderDesc("$createdAt"));
  queries.push(Query.limit(Math.min(filters.limit ?? 50, 200)));

  const result = await db.listRows<ActivityRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: true,
  });

  let items = result.rows.map(toActivity);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.organizer.toLowerCase().includes(q),
    );
  }

  return { items, total: result.total ?? items.length };
}

export async function listPublishedActivities(): Promise<Activity[]> {
  requireBackend();

  const db = adminTablesDB();
  const now = new Date().toISOString();

  const result = await db.listRows<ActivityRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries: [
      Query.equal("published", true),
      Query.equal("status", "published"),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ],
    total: false,
  });

  return result.rows.map(toActivity);
}

export async function getActivity(id: string): Promise<Activity | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<ActivityRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toActivity(row);
  } catch {
    return null;
  }
}

export async function getActivityBySlug(slug: string): Promise<Activity | null> {
  requireBackend();

  try {
    const result = await adminTablesDB().listRows<ActivityRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries: [Query.equal("slug", slug), Query.limit(1)],
      total: false,
    });
    if (result.rows.length === 0) return null;
    return toActivity(result.rows[0]);
  } catch {
    return null;
  }
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  requireBackend();

  try {
    const queries = [Query.equal("slug", slug), Query.limit(1)];
    if (excludeId) {
      // TablesDB does not support not-equal easily; fetch a few and filter.
    }
    const result = await adminTablesDB().listRows<ActivityRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      queries,
      total: false,
    });
    if (excludeId) {
      return result.rows.some((row) => row.$id !== excludeId);
    }
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

export async function createActivity(
  input: ActivityInput,
  admin?: { id: string; email: string },
): Promise<Activity> {
  requireBackend();

  if (await slugExists(input.slug)) {
    throw new Error(`An activity with slug "${input.slug}" already exists.`);
  }

  const db = adminTablesDB();
  const row = await db.createRow<ActivityRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      title: input.title,
      slug: input.slug,
      category: input.category,
      description: input.description,
      objectives: input.objectives,
      eligibility: input.eligibility,
      venue: input.venue,
      venueType: input.venueType,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      startTime: input.startTime,
      endTime: input.endTime,
      duration: input.duration,
      applicationOpensAt: input.applicationOpensAt ?? null,
      applicationDeadline: input.applicationDeadline ?? null,
      totalSlots: input.totalSlots,
      fee: input.fee,
      currency: input.currency,
      isFree: input.isFree,
      applicationsEnabled: input.applicationsEnabled,
      posterImageId: input.posterImageId,
      imageIds: JSON.stringify(input.imageIds),
      organizer: input.organizer,
      status: input.status,
      publishAt: input.publishAt ?? null,
      published: input.published,
    },
  });

  const activity = toActivity(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "activities",
      recordId: activity.id,
      details: `Created activity "${activity.title}" (${activity.slug})`,
    });
  }

  return activity;
}

export async function updateActivity(
  id: string,
  input: Partial<ActivityInput>,
  admin?: { id: string; email: string },
): Promise<Activity> {
  requireBackend();

  const existing = await getActivity(id);
  if (!existing) {
    throw new Error(`Activity with id "${id}" not found.`);
  }

  if (input.slug && input.slug !== existing.slug) {
    if (await slugExists(input.slug, id)) {
      throw new Error(`An activity with slug "${input.slug}" already exists.`);
    }
  }

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.category !== undefined) data.category = input.category;
  if (input.description !== undefined) data.description = input.description;
  if (input.objectives !== undefined) data.objectives = input.objectives;
  if (input.eligibility !== undefined) data.eligibility = input.eligibility;
  if (input.venue !== undefined) data.venue = input.venue;
  if (input.venueType !== undefined) data.venueType = input.venueType;
  if (input.startDate !== undefined) data.startDate = input.startDate ?? null;
  if (input.endDate !== undefined) data.endDate = input.endDate ?? null;
  if (input.startTime !== undefined) data.startTime = input.startTime;
  if (input.endTime !== undefined) data.endTime = input.endTime;
  if (input.duration !== undefined) data.duration = input.duration;
  if (input.applicationOpensAt !== undefined)
    data.applicationOpensAt = input.applicationOpensAt ?? null;
  if (input.applicationDeadline !== undefined)
    data.applicationDeadline = input.applicationDeadline ?? null;
  if (input.totalSlots !== undefined) data.totalSlots = input.totalSlots;
  if (input.fee !== undefined) data.fee = input.fee;
  if (input.currency !== undefined) data.currency = input.currency;
  if (input.isFree !== undefined) data.isFree = input.isFree;
  if (input.applicationsEnabled !== undefined)
    data.applicationsEnabled = input.applicationsEnabled;
  if (input.posterImageId !== undefined) data.posterImageId = input.posterImageId;
  if (input.imageIds !== undefined) data.imageIds = JSON.stringify(input.imageIds);
  if (input.organizer !== undefined) data.organizer = input.organizer;
  if (input.status !== undefined) data.status = input.status;
  if (input.publishAt !== undefined) data.publishAt = input.publishAt ?? null;
  if (input.published !== undefined) data.published = input.published;

  const row = await adminTablesDB().updateRow<ActivityRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data,
  });

  const activity = toActivity(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "activities",
      recordId: id,
      details: `Updated activity "${activity.title}"`,
    });
  }

  return activity;
}

export async function deleteActivity(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getActivity(id);
  if (!existing) {
    throw new Error(`Activity with id "${id}" not found.`);
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
      module: "activities",
      recordId: id,
      details: `Deleted activity "${existing.title}"`,
    });
  }
}