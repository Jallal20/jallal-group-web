"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  Save,
  X,
  FileText,
  Image,
  Play,
  Link,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Material = {
  id: string;
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
  createdAt: string;
  updatedAt: string;
};

const MATERIAL_TYPES = [
  "pdf",
  "slides",
  "document",
  "image",
  "video",
  "assignment",
  "reading",
  "link",
];

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function typeIcon(type: string) {
  const icons: Record<string, typeof FileText> = {
    pdf: FileText,
    slides: FileText,
    document: FileText,
    image: Image,
    video: Play,
    assignment: FileText,
    reading: FileText,
    link: Link,
  };
  return icons[type] || FileText;
}

export default function TrainingLearningMaterialsPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activityFilter) params.set("activityId", activityFilter);
      const res = await fetch(`/api/admin/learning-materials?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load learning materials.");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Learning materials could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [activityFilter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const input: Record<string, unknown> = {
      activityId: form.get("activityId") as string,
      activityTitle: form.get("activityTitle") as string,
      title: form.get("title") as string,
      description: form.get("description") as string,
      materialType: form.get("materialType") as string,
      fileId: form.get("fileId") as string,
      fileName: form.get("fileName") as string,
      url: form.get("url") as string,
      published: form.get("published") === "on",
    };

    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `/api/admin/learning-materials?id=${editing.id}`
        : "/api/admin/learning-materials";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save material.");
      }
      setEditing(null);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
      await fetchMaterials();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save material.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id: string, published: boolean) => {
    try {
      const res = await fetch(`/api/admin/learning-materials?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      if (!res.ok) throw new Error("Failed to update publication status.");
      await fetchMaterials();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update material.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete material "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/learning-materials?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete material.");
      await fetchMaterials();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete material.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Learning Materials</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Learning Materials
          </h1>
          <p className="text-body-md text-muted">
            Upload and distribute notes, slides, documents, videos, and
            assignments to enrolled students.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="accent" size="sm" disabled={loading} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
                  ×
                </button>
                <h2 className="text-headline-sm font-semibold text-ink mb-2">{editing ? "Edit Material" : "Add Material"}</h2>
                <p className="text-body-sm text-muted mb-6">
                  Upload learning materials for a specific program.
                </p>
                <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="activityId">Activity ID</Label>
                    <Input id="activityId" defaultValue={editing?.activityId ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="activityTitle">Activity title</Label>
                    <Input id="activityTitle" defaultValue={editing?.activityTitle ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" ref={titleRef} defaultValue={editing?.title ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" defaultValue={editing?.description ?? ""} rows={3} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="materialType">Material type</Label>
                    <Select defaultValue={editing?.materialType ?? "document"} id="materialType">
                      <option value="">Select material type</option>
                      {MATERIAL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fileId">File ID (Appwrite storage)</Label>
                    <Input id="fileId" defaultValue={editing?.fileId ?? ""} placeholder="Appwrite file ID" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fileName">File name</Label>
                    <Input id="fileName" defaultValue={editing?.fileName ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="url">External URL (for links/videos)</Label>
                    <Input id="url" defaultValue={editing?.url ?? ""} placeholder="https://..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      <Checkbox id="published" defaultChecked={Boolean(editing?.published)} />
                      Published
                    </Label>
                  </div>
                </form>
                <div className="flex flex-row-reverse gap-2 mt-6 pt-6 border-t border-line">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Update material" : "Add material"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setActivityFilter("")} disabled={loading || !activityFilter}>
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
        <div className="border-b border-line px-6 py-3 flex items-center gap-4">
          <Label className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
            Program
            <Select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-48 border-0 bg-transparent p-0"
            >
              <option value="">All programs</option>
              {[...new Set(items.map((m) => m.activityTitle))].map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </Select>
          </Label>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-body-sm text-muted">
            Loading learning materials…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-body-sm text-ink">No learning materials found.</p>
            <p className="mt-2 text-body-sm text-muted">
              Upload materials to distribute them to enrolled students.
            </p>
          </div>
        ) : (
          <table className="w-full text-left divide-y divide-line">
            <thead>
              <tr className="bg-surface text-label-sm text-muted uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold text-ink">Title</th>
                <th className="px-6 py-3 font-semibold text-ink">Program</th>
                <th className="px-6 py-3 font-semibold text-ink">Type</th>
                <th className="px-6 py-3 font-semibold text-ink">Uploaded</th>
                <th className="px-6 py-3 font-semibold text-ink">Published</th>
                <th className="px-6 py-3 font-semibold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((material) => (
                <MaterialRow
                  key={material.id}
                  material={material}
                  onEdit={(m) => setEditing(m)}
                  onTogglePublish={(id, published) => handleTogglePublish(id, published)}
                  onDelete={(id, title) => handleDelete(id, title)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        <h2 className="text-headline-sm font-semibold text-ink mb-4">Supported material types</h2>
        <ul className="space-y-2 text-body-sm text-muted list-disc list-inside">
          <li>PDF notes and reading materials</li>
          <li>Lecture slides</li>
          <li>Documents and images</li>
          <li>Videos or video links</li>
          <li>Assignments</li>
          <li>External links</li>
        </ul>
      </div>
    </div>
  );
}

function MaterialRow({
  material,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  material: any;
  onEdit: (m: any) => void;
  onTogglePublish: (id: string, published: boolean) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const Icon = typeIcon(material.materialType);
  return (
    <tr className="hover:bg-surface/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-semibold text-ink truncate">
              {material.title}
            </p>
            <p className="text-xs text-muted truncate">{material.fileName || material.fileId}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-body-sm text-ink truncate">{material.activityTitle}</td>
      <td className="px-6 py-4 text-body-sm text-ink capitalize">{material.materialType}</td>
      <td className="px-6 py-4 text-body-sm text-ink">{formatDate(material.createdAt)}</td>
      <td className="px-6 py-4">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
            material.published
              ? "bg-success/10 text-success border border-success/20"
              : "bg-danger/10 text-danger border border-danger/20",
          )}
        >
          {material.published ? "Published" : "Unpublished"}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(material)}
            title="Edit"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePublish(material.id, material.published)}
            title={material.published ? "Unpublish" : "Publish"}
          >
            {material.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(material.id, material.title)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
