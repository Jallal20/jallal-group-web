"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  Save,
  X,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CourseCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CourseCategoriesPage() {
  const [items, setItems] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/course-categories?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load course categories.");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Course categories could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const name = form.get("name") as string;
    const slug = form.get("slug") as string;
    const description = form.get("description") as string;
    const published = form.get("published") === "on";

    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `/api/admin/course-categories?id=${editing.id}`
        : "/api/admin/course-categories";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description, published }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save category.");
      }
      setEditing(null);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/course-categories?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category.");
      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete category.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Course Categories</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Course Categories
          </h1>
          <p className="text-body-md text-muted">
            Organise Jallal Institute of Technology courses into categories.
            Categories appear on the public course catalogue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="accent" size="sm" disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
                <DialogDescription>
                  Give the category a name, slug, and optional description.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Category name</Label>
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
                    placeholder="software-development"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    defaultValue={editing?.description ?? ""}
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-2">
                    <Checkbox
                      id="published"
                      defaultChecked={Boolean(editing?.published)}
                    />
                    Publish publicly
                  </Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Update category" : "Create category"}
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
          <Search className="h-4 w-4 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or slug…"
            className="flex-1 bg-transparent border-0 outline-none text-body-sm"
          />
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-body-sm text-muted">
            Loading course categories…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <Building2 className="h-6 w-6" />
            </div>
            <p className="text-body-sm text-ink">No course categories found.</p>
            {search ? (
              <p className="mt-2 text-body-sm text-muted">
                Try clearing the search.
              </p>
            ) : (
              <p className="mt-2 text-body-sm text-muted">
                Add your first category to organise courses.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-left divide-y divide-line">
            <thead>
              <tr className="bg-surface text-label-sm text-muted uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold text-ink">Category</th>
                <th className="px-6 py-3 font-semibold text-ink">Slug</th>
                <th className="px-6 py-3 font-semibold text-ink">Description</th>
                <th className="px-6 py-3 font-semibold text-ink">Status</th>
                <th className="px-6 py-3 font-semibold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((category) => (
                <tr key={category.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-body-sm font-semibold text-ink">
                      {category.name}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink font-mono">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-muted">
                    {category.description || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                        category.published
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-danger/10 text-danger border border-danger/20",
                      )}
                    >
                      {category.published ? "Published" : "Unpublished"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(category)}
                        disabled={saving || deletingId !== null}
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(category.id, category.name)}
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

      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        <h2 className="text-headline-sm font-semibold text-ink mb-4">
          About course categories
        </h2>
        <ul className="space-y-3 text-body-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            Categories group related courses on the public course catalogue.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            Only published categories are visible to the public.
          </li>
          </ul>
      </div>
    </div>
  );
}

