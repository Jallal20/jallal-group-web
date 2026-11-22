export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/mov"];

export function mediaUrl(fileId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID ?? "";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${projectId}`;
}

export function previewUrl(fileId: string): string {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID ?? "";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${projectId}`;
}
