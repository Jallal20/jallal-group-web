import "server-only";

import { ID, Storage, type Models } from "node-appwrite";
import { adminClient } from "@/lib/appwrite";
import { env, isAppwriteConfigured } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";

const BUCKET_ID = env.storageBucketId;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/mov"];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export type FileRecord = {
  id: string;
  bucketId: string;
  fileId: string;
  name: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
};

export class BackendNotConfiguredError extends Error {
  constructor() {
    super("The Appwrite backend is not configured for this deployment.");
    this.name = "BackendNotConfiguredError";
  }
}

function requireBackend(): void {
  if (!isAppwriteConfigured()) throw new BackendNotConfiguredError();
}

function storage() {
  return new Storage(adminClient());
}

export async function validateFile(
  file: File,
  options: { allowImages?: boolean; allowVideos?: boolean } = {},
): Promise<void> {
  requireBackend();

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File exceeds ${MAX_FILE_SIZE / (1024 * 1024)} MB limit.`);
  }

  const types = [
    ...(options.allowImages ? ALLOWED_IMAGE_TYPES : []),
    ...(options.allowVideos ? ALLOWED_VIDEO_TYPES : []),
  ];

  if (types.length > 0 && !types.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}.`);
  }
}

export async function uploadFile(
  file: File,
  options: {
    uploadedBy: string;
    allowImages?: boolean;
    allowVideos?: boolean;
    module?: string;
    recordId?: string;
    action?: string;
    admin?: { id: string; email: string };
  },
): Promise<FileRecord> {
  requireBackend();

  await validateFile(file, options);

  const arrayBuffer = await file.arrayBuffer();
  const bucket = storage();

  const response = await bucket.createFile(
    BUCKET_ID,
    ID.unique(),
    file,
  );

  const fileRecord: FileRecord = {
    id: response.$id,
    bucketId: response.bucketId,
    fileId: response.$id,
    name: response.name,
    mimeType: response.mimeType,
    size: response.sizeOriginal,
    path: response.$id,
    url: `${env.endpoint}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${env.projectId}`,
    uploadedBy: options.uploadedBy,
    uploadedAt: new Date().toISOString(),
  };

  if (options.admin) {
    await writeAuditLog({
      adminId: options.admin.id,
      adminEmail: options.admin.email,
      action: options.action ?? "upload",
      module: options.module ?? "media-library",
      recordId: options.recordId ?? response.$id,
      details: `Uploaded file "${fileRecord.name}" (${fileRecord.size} bytes)`,
    });
  }

  return fileRecord;
}

export async function deleteFile(
  fileId: string,
  admin?: { id: string; email: string },
  module?: string,
  recordId?: string,
): Promise<void> {
  requireBackend();

  await storage().deleteFile(BUCKET_ID, fileId);

  if (admin) {
    await writeAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete",
      module: module ?? "media-library",
      recordId: recordId ?? fileId,
      details: `Deleted file ${fileId}`,
    });
  }
}

export async function listFiles(
  limit = 50,
  offset = 0,
): Promise<{ items: FileRecord[]; total: number }> {
  requireBackend();

  const result = await storage().listFiles(BUCKET_ID, [
    `limit=${Math.min(limit, 100)}`,
    `offset=${offset}`,
    "orderDesc=$createdAt",
  ]);

  return {
    items: result.files.map((f: Models.File) => ({
      id: f.$id,
      bucketId: f.bucketId,
      fileId: f.$id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.sizeOriginal,
      path: f.$id,
      url: `${env.endpoint}/storage/buckets/${BUCKET_ID}/files/${f.$id}/view?project=${env.projectId}`,
      uploadedBy: "",
      uploadedAt: f.$createdAt,
    })),
    total: result.total,
  };
}

export function mediaUrl(fileId: string): string {
  return `${env.endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${env.projectId}`;
}

export function previewUrl(fileId: string): string {
  return `${env.endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/preview?project=${env.projectId}`;
}

export { MAX_FILE_SIZE };
