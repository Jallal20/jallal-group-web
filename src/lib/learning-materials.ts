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

export type MaterialType =
  | "pdf"
  | "slides"
  | "document"
  | "image"
  | "video"
  | "assignment"
  | "reading"
  | "link";

export interface LearningMaterial {
  id: string;
  activityId: string;
  activityTitle: string;
  title: string;
  description: string;
  materialType: MaterialType;
  fileId: string;
  fileName: string;
  url: string;
  published: boolean;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

type MaterialRow = Models.Row & {
  activityId: string;
  activityTitle: string;
  title: string;
  description: string;
  materialType: string;
  fileId: string;
  fileName: string;
  url: string;
  published: boolean;
  uploadedBy: string | null;
};

function toMaterial(row: MaterialRow): LearningMaterial {
  return {
    id: row.$id,
    activityId: row.activityId,
    activityTitle: row.activityTitle,
    title: row.title,
    description: row.description,
    materialType: row.materialType as MaterialType,
    fileId: row.fileId,
    fileName: row.fileName,
    url: row.url,
    published: row.published,
    uploadedBy: row.uploadedBy,
    createdAt: row.$createdAt,
    updatedAt: row.$updatedAt,
  };
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

const TABLE_ID = env.learningMaterialsId;

export type MaterialInput = {
  activityId: string;
  activityTitle: string;
  title: string;
  description: string;
  materialType: MaterialType;
  fileId: string;
  fileName: string;
  url: string;
  published: boolean;
};

export async function listLearningMaterials(
  activityId?: string,
): Promise<LearningMaterial[]> {
  requireBackend();

  const db = adminTablesDB();
  const queries: string[] = [];

  if (activityId) {
    queries.push(Query.equal("activityId", activityId));
  }

  queries.push(Query.orderDesc("$createdAt"));
  queries.push(Query.limit(100));

  const result = await db.listRows<MaterialRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    queries,
    total: false,
  });
  return result.rows.map(toMaterial);
}

export async function getPublishedMaterials(activityId: string): Promise<LearningMaterial[]> {
  requireBackend();

  const all = await listLearningMaterials(activityId);
  return all.filter((m) => m.published);
}

export async function getLearningMaterial(id: string): Promise<LearningMaterial | null> {
  requireBackend();

  try {
    const row = await adminTablesDB().getRow<MaterialRow>({
      databaseId: env.databaseId,
      tableId: TABLE_ID,
      rowId: id,
    });
    return toMaterial(row);
  } catch {
    return null;
  }
}

export async function createLearningMaterial(
  input: MaterialInput,
  admin?: { id: string; email: string },
): Promise<LearningMaterial> {
  requireBackend();

  const db = adminTablesDB();
  const row = await db.createRow<MaterialRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: ID.unique(),
    data: {
      activityId: input.activityId,
      activityTitle: input.activityTitle,
      title: input.title,
      description: input.description,
      materialType: input.materialType,
      fileId: input.fileId,
      fileName: input.fileName,
      url: input.url,
      published: input.published,
      uploadedBy: admin?.id ?? null,
    },
  });

  const material = toMaterial(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create",
      module: "learning_materials",
      recordId: material.id,
      details: `Uploaded learning material "${material.title}" for ${input.activityTitle}`,
    });
  }

  return material;
}

export async function updateLearningMaterial(
  id: string,
  input: Partial<MaterialInput>,
  admin?: { id: string; email: string },
): Promise<LearningMaterial> {
  requireBackend();

  const existing = await getLearningMaterial(id);
  if (!existing) {
    throw new Error(`Learning material with id "${id}" not found.`);
  }

  const data: Record<string, unknown> = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.materialType !== undefined) data.materialType = input.materialType;
  if (input.fileId !== undefined) data.fileId = input.fileId;
  if (input.fileName !== undefined) data.fileName = input.fileName;
  if (input.url !== undefined) data.url = input.url;
  if (input.published !== undefined) data.published = input.published;

  const row = await adminTablesDB().updateRow<MaterialRow>({
    databaseId: env.databaseId,
    tableId: TABLE_ID,
    rowId: id,
    data,
  });

  const material = toMaterial(row);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update",
      module: "learning_materials",
      recordId: id,
      details: `Updated learning material "${material.title}"`,
    });
  }

  return material;
}

export async function deleteLearningMaterial(
  id: string,
  admin?: { id: string; email: string },
): Promise<void> {
  requireBackend();

  const existing = await getLearningMaterial(id);
  if (!existing) {
    throw new Error(`Learning material with id "${id}" not found.`);
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
      module: "learning_materials",
      recordId: id,
      details: `Deleted learning material "${existing.title}"`,
    });
  }
}
