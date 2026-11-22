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
  Megaphone,
  Clock,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Announcement = {
  id: string;
  activityId: string | null;
  activityTitle: string;
  audience: string;
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
};

const AUDIENCES = [
  { value: "all", label: "All students" },
  { value: "program", label: "Students in a specific program" },
  { value: "approved", label: "Approved students only" },
  { value: "applicants", label: "Applicants of a specific activity" },
  { value: "individual", label: "Individual students" },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TrainingProgramAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/program-announcements`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load announcements.");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Announcements could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const input: Record<string, unknown> = {
      activityId: form.get("activityId") as string || null,
      activityTitle: form.get("activityTitle") as string,
      audience: form.get("audience") as string,
      targetStudentIds: [],
      title: form.get("title") as string,
      message: form.get("message") as string,
      fileId: form.get("fileId") as string,
      fileName: form.get("fileName") as string,
      publishAt: form.get("publishAt") as string || null,
      published: form.get("published") === "on",
    };

    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `/api/admin/program-announcements?id=${editing.id}`
        : "/api/admin/program-announcements";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save announcement.");
      }
      setEditing(null);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
      await fetchAnnouncements();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete announcement "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/program-announcements?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete announcement.");
      await fetchAnnouncements();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete announcement.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Program Announcements</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Program Announcements
          </h1>
          <p className="text-body-md text-muted">
            Send announcements to all students, specific programs, or individual
            students. Delivered to student dashboards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="accent" size="sm" disabled={loading} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Announcement
          </Button>
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
                  ×
                </button>
                <h2 className="text-headline-sm font-semibold text-ink mb-2">{editing ? "Edit Announcement" : "Add Announcement"}</h2>
                <p className="text-body-sm text-muted mb-6">
                  Create an announcement and select the target audience.
                </p>
                <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" ref={titleRef} defaultValue={editing?.title ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" defaultValue={editing?.message ?? ""} rows={4} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="audience">Audience</Label>
                    <Select defaultValue={editing?.audience ?? "all"} id="audience">
                      <option value="">Select audience</option>
                      {AUDIENCES.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="activityTitle">Activity / program title</Label>
                    <Input id="activityTitle" defaultValue={editing?.activityTitle ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="activityId">Activity ID (optional)</Label>
                    <Input id="activityId" defaultValue={editing?.activityId ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fileId">File ID (attachment, optional)</Label>
                    <Input id="fileId" defaultValue={editing?.fileId ?? ""} placeholder="Appwrite file ID" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fileName">File name</Label>
                    <Input id="fileName" defaultValue={editing?.fileName ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="publishAt">Schedule publication (optional)</Label>
                    <input id="publishAt" type="datetime-local" defaultValue={editing?.publishAt ?? ""} className="block w-full rounded-md border border-line bg-white px-3 py-2 text-body-sm shadow-sm focus:border-accent focus:outline-none" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      <Checkbox id="published" defaultChecked={Boolean(editing?.published)} />
                      Publish now
                    </Label>
                  </div>
                </form>
                <div className="flex flex-row-reverse gap-2 mt-6 pt-6 border-t border-line">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Update announcement" : "Create announcement"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => {}} disabled={loading}>
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
        {loading ? (
          <div className="px-6 py-12 text-center text-body-sm text-muted">
            Loading announcements…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <Megaphone className="h-6 w-6" />
            </div>
            <p className="text-body-sm text-ink">No announcements found.</p>
            <p className="mt-2 text-body-sm text-muted">
              Create your first announcement to notify students.
            </p>
          </div>
        ) : (
          <table className="w-full text-left divide-y divide-line">
            <thead>
              <tr className="bg-surface text-label-sm text-muted uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold text-ink">Title</th>
                <th className="px-6 py-3 font-semibold text-ink">Audience</th>
                <th className="px-6 py-3 font-semibold text-ink">Program</th>
                <th className="px-6 py-3 font-semibold text-ink">Published</th>
                <th className="px-6 py-3 font-semibold text-ink">Created</th>
                <th className="px-6 py-3 font-semibold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((announcement) => (
                <tr key={announcement.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-body-sm font-semibold text-ink truncate">
                      {announcement.title}
                    </p>
                    <p className="text-xs text-muted">{announcement.message.slice(0, 80)}…</p>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink capitalize">{announcement.audience}</td>
                  <td className="px-6 py-4 text-body-sm text-muted">{announcement.activityTitle || "—"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                        announcement.published
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-danger/10 text-danger border border-danger/20",
                      )}
                    >
                      {announcement.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink">{formatDate(announcement.createdAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(announcement)}
                        disabled={saving || deletingId !== null}
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(announcement.id, announcement.title)}
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
        <h2 className="text-headline-sm font-semibold text-ink mb-4">Audience options</h2>
        <ul className="space-y-2 text-body-sm text-muted list-disc list-inside">
          <li><strong>All students</strong> — delivered to every registered student.</li>
          <li><strong>Program</strong> — delivered to students in a specific program.</li>
          <li><strong>Approved students only</strong> — delivered to students with approved applications.</li>
          <li><strong>Applicants</strong> — delivered to applicants of a specific activity.</li>
          <li><strong>Individual students</strong> — delivered to selected students.</li>
        </ul>
      </div>
    </div>
  );
}
