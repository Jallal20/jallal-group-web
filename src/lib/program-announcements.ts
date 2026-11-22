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

export type AnnouncementAudience = "all" | "program" | "approved" | "applicants" | "individual";

export interface ProgramAnnouncement {
  id: string;
  activityId: string | null;
  activityTitle: string;
  audience: AnnouncementAudience;
  targetStudentIds: string[];
  title: string;
  message: string;
  fileId: string;
  fileName: string;
  publishAt: string | null;
  published: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

type AnnouncementRow = Models.Row & {
  activityId: string | null;
  activityTitle: string;
  audience: string;
  targetStudentIds: string;
  title: string;
  message: string;
  fileId: string;
  fileName: string;
  publishAt: string | null;
  published: boolean;
  createdBy: string | null;
};

function toAnnouncement(row: AnnouncementRow): ProgramAnnouncement {
  return {
    id: row.$id,
    activityId: row.activityId,
    activityTitle: row.activityTitle,
    audience: row.audience as AnnouncementAudience,
    targetStudentIds: safeParseJsonArray(row.targetStudentIds),
    title: row.title,
    message: row.message,
    fileId: row.fileId,
    fileName: row.fileName,
    publishAt: row.publishAt,
    published: row.published,
    createdBy: row.createdBy,
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

const TABLE_ID = env.programAnnouncementsId;

export type AnnouncementInput = {
  activityId: string | null;
  activityTitle: string;
  audience: AnnouncementAudience;
  targetStudentIds: string[];
  title: string;
  message: string;
  fileId: string;
  fileName: string;
  publishAt: string | null;
  published: boolean;
};

export async function listProgramAnnouncements(): Promise<ProgramAnnouncement[]> {
  requireBackend();

  const db = adminTablesDB();
  const result = await db.listRows<AnnouncementRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries: [Query.orderDesc("$createdAt"), Query.limit(100)],
    total: false,
  });
  return result.rows.map(toAnnouncement);
}

export async function getProgramAnnouncement(id: string): Promise<ProgramAnnouncement | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<AnnouncementRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toAnnouncement(row);
  } catch {
    return null;
  }
}

export async function getAnnouncementsForStudent(
  studentId: string,
  activityId?: string,
): Promise<ProgramAnnouncement[]> {
  requireBackend();

  const all = await listProgramAnnouncements();
  const now = new Date().toISOString();

  return all.filter((a) => {
    if (!a.published) return false;
    if (a.publishAt && new Date(a.publishAt) > new Date(now)) return false;
    if (activityId && a.activityId && a.activityId !== activityId) return false;

    if (a.audience === "all") return true;
    if (a.audience === "individual") return a.targetStudentIds.includes(studentId);
    // program, approved, applicants audiences handled client-side via targeting
    return true;
  });
}

export async function createProgramAnnouncement(
  input: AnnouncementInput,
  admin?: { id: string; email: string },
): Promise<ProgramAnnouncement> {
  requireBackend();

  const db = adminTablesDB();
  const row = await db.createRow<AnnouncementRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      activityId: input.activityId ?? null,
      activityTitle: input.activityTitle,
      audience: input.audience,
      targetStudentIds: JSON.stringify(input.targetStudentIds),
      title: input.title,
      message: input.message,
      fileId: input.fileId,
      fileName: input.fileName,
      publishAt: input.publishAt ?? null,
      published: input.published,
      createdBy: admin?.id ?? null,
    },
  });

  const announcement = toAnnouncement(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "program_announcements",
      recordId: announcement.id,
      details: `Created announcement "${announcement.title}" (audience: ${announcement.audience})`,
    });
  }

  return announcement;
}

export async function updateProgramAnnouncement(
  id: string,
  input: Partial<AnnouncementInput>,
  admin?: { id: string; email: string },
): Promise<ProgramAnnouncement> {
  requireBackend();

  const existing = await getProgramAnnouncement(id);
  if (!existing) {
    throw new Error(`Announcement with id "${id}" not found.`);
  }

  const data: Record<string, unknown> = {};
  if (input.activityId !== undefined) data.activityId = input.activityId ?? null;
  if (input.activityTitle !== undefined) data.activityTitle = input.activityTitle;
  if (input.audience !== undefined) data.audience = input.audience;
  if (input.targetStudentIds !== undefined)
    data.targetStudentIds = JSON.stringify(input.targetStudentIds);
  if (input.title !== undefined) data.title = input.title;
  if (input.message !== undefined) data.message = input.message;
  if (input.fileId !== undefined) data.fileId = input.fileId;
  if (input.fileName !== undefined) data.fileName = input.fileName;
  if (input.publishAt !== undefined) data.publishAt = input.publishAt ?? null;
  if (input.published !== undefined) data.published = input.published;

  const row = await adminTablesDB().updateRow<AnnouncementRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data,
  });

  const announcement = toAnnouncement(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "program_announcements",
      recordId: id,
      details: `Updated announcement "${announcement.title}"`,
    });
  }

  return announcement;
}

export async function deleteProgramAnnouncement(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getProgramAnnouncement(id);
  if (!existing) {
    throw new Error(`Announcement with id "${id}" not found.`);
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
      module: "program_announcements",
      recordId: id,
      details: `Deleted announcement "${existing.title}"`,
    });
  }
}
