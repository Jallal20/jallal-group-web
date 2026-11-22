"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  imageIds: string[];
  status: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

const STATUSES = ["planned", "in-development", "completed", "on-hold"] as const;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function JallalTechPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/tech-projects?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load Jallal Tech projects.");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Jallal Tech projects could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      name: form.get("name") as string,
      slug: form.get("slug") as string,
      description: form.get("description") as string,
      category: form.get("category") as string,
      imageIds: (form.get("imageIds") as string)?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
      status: form.get("status") as string,
      published: form.get("published") === "on",
    };

    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `/api/admin/tech-projects?id=${editing.id}`
        : "/api/admin/tech-projects";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save project.");
      }
      setEditing(null);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
      await fetchProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/tech-projects?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project.");
      await fetchProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Jallal Tech</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Jallal Tech Projects
          </h1>
          <p className="text-body-md text-muted">
            Manage software development, IT solutions, data analytics and
            digital innovation projects. Published items appear on the public
            Jallal Tech page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="accent" size="sm" disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[640px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Project" : "Add Project"}</DialogTitle>
                <DialogDescription>
                  Define the project name, description, category, status and
                  publication state.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Project name</Label>
                    <Input
                      id="name"
                      ref={nameRef}
                      defaultValue={editing?.name ?? ""}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      defaultValue={editing?.slug ?? ""}
                      required
                      placeholder="enterprise-platform"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      defaultValue={editing?.description ?? ""}
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      defaultValue={editing?.category ?? ""}
                      placeholder="e.g. Enterprise platforms"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select id="status" defaultValue={editing?.status ?? "planned"}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="imageIds">Image IDs (comma-separated)</Label>
                    <Input
                      id="imageIds"
                      defaultValue={
                        Array.isArray(editing?.imageIds)
                          ? editing.imageIds.join(", ")
                          : ""
                      }
                      placeholder="Select from Media Library"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      <Checkbox id="published"                       defaultChecked={Boolean(editing?.published)} />
                      Publish publicly
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Update project" : "Create project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
          <Layers className="h-4 w-4 text-accent" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, category, status…"
            className="flex-1 bg-transparent border-0 outline-none text-body-sm"
          />
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-body-sm text-muted">
            Loading projects…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <Layers className="h-6 w-6" />
            </div>
            <p className="text-body-sm text-ink">No Jallal Tech projects found.</p>
            {search ? (
              <p className="mt-2 text-body-sm text-muted">
                Try clearing the search.
              </p>
            ) : (
              <p className="mt-2 text-body-sm text-muted">
                Add your first project to begin managing Jallal Tech.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-left divide-y divide-line">
            <thead>
              <tr className="bg-surface text-label-sm text-muted uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold text-ink">Project</th>
                <th className="px-6 py-3 font-semibold text-ink">Category</th>
                <th className="px-6 py-3 font-semibold text-ink">Status</th>
                <th className="px-6 py-3 font-semibold text-ink">Published</th>
                <th className="px-6 py-3 font-semibold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((project) => (
                <tr key={project.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-body-sm font-semibold text-ink">
                      {project.name}
                    </p>
                    <p className="text-label-xs text-muted">{project.slug}</p>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-muted">
                    {project.category || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                        project.status === "completed"
                          ? "bg-success/10 text-success border border-success/20"
                          : project.status === "in-development"
                            ? "bg-accent/10 text-ink border border-accent/20"
                            : project.status === "planned"
                              ? "bg-muted/20 text-muted border border-line"
                              : "bg-warning-soft/50 text-warning border border-warning/20",
                      )}
                    >
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                        project.published
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-danger/10 text-danger border border-danger/20",
                      )}
                    >
                      {project.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(project)}
                        disabled={saving || deletingId !== null}
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(project.id, project.name)}
                        disabled={saving || deletingId !== null}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
