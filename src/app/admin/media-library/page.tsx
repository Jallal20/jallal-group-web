"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, Image as ImageIcon, Film, Search, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { previewUrl } from "@/lib/storage-urls";

type MediaFile = {
  id: string;
  fileId: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
};

const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      const res = await fetch(`/api/admin/media-library?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load media files.");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Media files could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadFromInput = (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const allowImages = IMAGE_TYPES.includes(file.type);
    form.set("allowImages", String(allowImages));
    form.set("allowVideos", String(!allowImages && /^video\//.test(file.type)));
    setUploading(true);
    fetch("/api/admin/media-library/upload", {
      method: "POST",
      body: form,
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Upload failed.");
        }
        return res.json();
      })
      .then(() => {
        setUploading(false);
        void fetchFiles();
      })
      .catch((err) => {
        setUploading(false);
        alert(err instanceof Error ? err.message : "Upload failed.");
      });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/media-library?fileId=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete file.");
      await fetchFiles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete file.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = items.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.mimeType.toLowerCase().includes(search.toLowerCase()),
  );

  const isImage = (mime: string) => IMAGE_TYPES.includes(mime);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Media Library</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Media Library
          </h1>
          <p className="text-body-md text-muted">
            Upload and manage images, logos and media files. Stored in Appwrite
            Storage; linked to database records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="accent"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload file
          </Button>
          <input
            ref={fileInput}
            type="file"
            className="hidden"
            accept="image/*,video/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              handleUploadFromInput(file);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearch("")}
            disabled={loading || !search}
          >
            <Search className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-5 text-body-sm text-danger">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-line bg-white shadow-card overflow-hidden">
        <div className="border-b border-line px-6 py-3 flex items-center gap-3">
          <Search className="h-4 w-4 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files by name or type…"
            className="flex-1 bg-transparent border-0 outline-none text-body-sm"
          />
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-body-sm text-muted">
            Loading media files…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="text-body-sm text-ink">No media files found.</p>
            {search ? (
              <p className="mt-2 text-body-sm text-muted">
                Try clearing the search.
              </p>
            ) : (
              <p className="mt-2 text-body-sm text-muted">
                Upload your first image, logo or document.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 p-4">
              {filtered.map((file) => (
                <div
                  key={file.id}
                  className="relative group rounded-md border border-line bg-surface overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setPreview({ url: previewUrl(file.fileId), name: file.name })
                    }
                    className="flex flex-col items-center gap-2 p-3"
                  >
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-md border border-line/50">
                      {isImage(file.mimeType) ? (
                        <img
                          src={previewUrl(file.fileId)}
                          alt={file.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-md bg-line/30 text-muted">
                          {/^video\//.test(file.mimeType) ? (
                            <Film className="h-6 w-6" />
                          ) : (
                            <Download className="h-6 w-6" />
                          )}
                        </div>
                      )}
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] font-bold border border-line">
                        {file.mimeType.split("/")[0]}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-muted">{file.name}</p>
                    <p className="truncate text-[10px] text-muted/60">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </button>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void navigator.clipboard.writeText(file.url);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-ink shadow-sm"
                      title="Copy URL"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(file.id, file.name);
                      }}
                      disabled={deletingId === file.id}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-danger/30 bg-white text-danger shadow-sm hover:bg-danger hover:text-white"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length > 0 && (
              <div className="border-t border-line px-6 py-3 flex items-center justify-between text-label-sm text-muted">
                <span>
                  {filtered.length} file{filtered.length === 1 ? "" : "s"} shown
                </span>
                <span>Maximum 100 per view</span>
              </div>
            )}
          </>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="relative z-10 max-w-4xl max-h-[90vh] flex flex-col items-center gap-3 p-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute right-4 top-4 rounded-md border border-white/20 bg-white/10 text-white p-2 hover:bg-white/20"
              aria-label="Close"
            >
              <span className="sr-only">Close</span>
              <XIcon className="h-5 w-5" />
            </button>
            <img
              src={preview.url}
              alt={preview.name}
              className="max-w-full max-h-[70vh] rounded-md border border-white/20 shadow-overlay object-contain"
              loading="lazy"
            />
            <p className="text-body-sm text-white truncate max-w-md">{preview.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
