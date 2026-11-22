"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  Save,
  X,
  Eye,
  EyeOff,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Activity = {
  id: string;
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
  imageIds: string[];
  organizer: string;
  status: string;
  publishAt: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

const CATEGORIES = [
  "boot-camp",
  "hackathon",
  "web-development",
  "app-development",
  "data-analysis",
  "artificial-intelligence",
  "cybersecurity",
  "digital-skills",
  "videography",
  "entrepreneurship",
  "conference",
  "seminar",
  "community-outreach",
  "other",
];

const VENUE_TYPES = ["physical", "online", "hybrid"];
const STATUSES = ["draft", "scheduled", "published", "archived"];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function labelFor(value: string): string {
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function TrainingActivitiesPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [publishedFilter, setPublishedFilter] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      if (publishedFilter) params.set("published", publishedFilter);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/activities?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load activities.");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activities could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, publishedFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const input: Record<string, unknown> = {
      title: form.get("title") as string,
      slug: form.get("slug") as string,
      category: form.get("category") as string,
      description: form.get("description") as string,
      objectives: form.get("objectives") as string,
      eligibility: form.get("eligibility") as string,
      venue: form.get("venue") as string,
      venueType: form.get("venueType") as string,
      startDate: form.get("startDate") as string || null,
      endDate: form.get("endDate") as string || null,
      startTime: form.get("startTime") as string,
      endTime: form.get("endTime") as string,
      duration: form.get("duration") as string,
      applicationOpensAt: form.get("applicationOpensAt") as string || null,
      applicationDeadline: form.get("applicationDeadline") as string || null,
      totalSlots: parseInt(String(form.get("totalSlots")), 10) || 0,
      fee: parseInt(String(form.get("fee")), 10) || 0,
      currency: form.get("currency") as string,
      isFree: form.get("isFree") === "on",
      applicationsEnabled: form.get("applicationsEnabled") !== "off",
      posterImageId: form.get("posterImageId") as string,
      imageIds: [],
      organizer: form.get("organizer") as string,
      status: form.get("status") as string,
      publishAt: form.get("publishAt") as string || null,
      published: form.get("published") === "on",
    };

    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing
        ? `/api/admin/activities/${editing.id}`
        : "/api/admin/activities";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save activity.");
      }
      setEditing(null);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
      await fetchActivities();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save activity.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete activity "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/activities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete activity.");
      await fetchActivities();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete activity.");
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublish = async (id: string, published: boolean, title: string) => {
    try {
      const res = await fetch(`/api/admin/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });
      if (!res.ok) throw new Error("Failed to update publication status.");
      await fetchActivities();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update activity.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Training Activities</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Activities Management
          </h1>
          <p className="text-body-md text-muted">
            Create, edit, publish, and unpublish training activities. Published
            activities appear on the public activities page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="accent" size="sm" disabled={loading} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
                  ×
                </button>
                <h2 className="text-headline-sm font-semibold text-ink mb-2">{editing ? "Edit Activity" : "Add Activity"}</h2>
                <p className="text-body-sm text-muted mb-6">
                  Enter the activity details. Set status to "published" to make
                  it visible on the public website.
                </p>
                <form onSubmit={handleSave} className="space-y-5 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="title">Activity title</Label>
                      <Input id="title" ref={titleRef} defaultValue={editing?.title ?? ""} required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        defaultValue={editing?.slug ?? ""}
                        required
                        placeholder="web-development-bootcamp"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select defaultValue={editing?.category ?? ""} id="category">
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {labelFor(c)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="venueType">Venue type</Label>
                      <Select defaultValue={editing?.venueType ?? "physical"} id="venueType">
                        <option value="">Select venue type</option>
                        {VENUE_TYPES.map((v) => (
                          <option key={v} value={v}>
                            {labelFor(v)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="organizer">Organizer</Label>
                    <Input id="organizer" defaultValue={editing?.organizer ?? "Jallal Group"} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" defaultValue={editing?.description ?? ""} rows={3} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="objectives">Program objectives</Label>
                    <Textarea id="objectives" defaultValue={editing?.objectives ?? ""} rows={3} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="eligibility">Eligibility requirements</Label>
                    <Textarea id="eligibility" defaultValue={editing?.eligibility ?? ""} rows={3} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="venue">Venue / meeting details</Label>
                      <Input id="venue" defaultValue={editing?.venue ?? ""} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Input id="duration" defaultValue={editing?.duration ?? ""} placeholder="e.g. 4 weeks" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="startDate">Start date</Label>
                      <input id="startDate" type="date" defaultValue={editing?.startDate ?? ""} className="block w-full rounded-md border border-line bg-white px-3 py-2 text-body-sm shadow-sm focus:border-accent focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="endDate">End date</Label>
                      <input id="endDate" type="date" defaultValue={editing?.endDate ?? ""} className="block w-full rounded-md border border-line bg-white px-3 py-2 text-body-sm shadow-sm focus:border-accent focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="startTime">Start time</Label>
                      <input id="startTime" type="time" defaultValue={editing?.startTime ?? ""} className="block w-full rounded-md border border-line bg-white px-3 py-2 text-body-sm shadow-sm focus:border-accent focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="endTime">End time</Label>
                      <input id="endTime" type="time" defaultValue={editing?.endTime ?? ""} className="block w-full rounded-md border border-line bg-white px-3 py-2 text-body-sm shadow-sm focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="applicationOpensAt">Application opens at</Label>
                      <input id="applicationOpensAt" type="datetime-local" defaultValue={editing?.applicationOpensAt ?? ""} className="block w-full rounded-md border border-line bg-white px-3 py-2 text-body-sm shadow-sm focus:border-accent focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="applicationDeadline">Application deadline</Label>
                      <input id="applicationDeadline" type="datetime-local" defaultValue={editing?.applicationDeadline ?? ""} className="block w-full rounded-md border border-line bg-white px-3 py-2 text-body-sm shadow-sm focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="totalSlots">Available slots</Label>
                      <Input id="totalSlots" type="number" defaultValue={String(editing?.totalSlots ?? 0)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="fee">Fee</Label>
                      <Input id="fee" type="number" defaultValue={String(editing?.fee ?? 0)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Input id="currency" defaultValue={editing?.currency ?? "SLE"} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2">
                        <Checkbox id="isFree" defaultChecked={Boolean(editing?.isFree)} />
                        Free activity
                      </Label>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="flex items-center gap-2">
                        <Checkbox id="applicationsEnabled" defaultChecked={Boolean(editing?.applicationsEnabled ?? true)} />
                        Enable applications
                      </Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="posterImageId">Poster image ID</Label>
                      <Input id="posterImageId" defaultValue={editing?.posterImageId ?? ""} placeholder="Appwrite file ID" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="publishAt">Schedule publication (optional)</Label>
                      <input id="publishAt" type="datetime-local" defaultValue={editing?.publishAt ?? ""} className="block w-full rounded-md border border-line bg-white px-3 py-2 text-body-sm shadow-sm focus:border-accent focus:outline-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      <Checkbox id="statusPublished" defaultChecked={editing?.status === "published" || editing?.published} />
                      Publish publicly
                    </Label>
                    <p className="text-xs text-muted">
                      When published, this activity appears on the public activities page.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="status">Status</Label>
                      <Select defaultValue={editing?.status ?? "draft"} id="status">
                        <option value="">Select status</option>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {labelFor(s)}
                          </option>
                        ))}
                      </Select>
                  </div>
                </form>
                <div className="flex flex-row-reverse gap-2 mt-6 pt-6 border-t border-line">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Update activity" : "Create activity"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setSearch("")} disabled={loading || !search}>
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
            placeholder="Search activities by title, category, or organizer…"
            className="flex-1 bg-transparent border-0 outline-none text-body-sm"
          />
        </div>
        <div className="px-6 py-3 border-b border-line flex items-center gap-4">
          <Label className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
            Status
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPublishedFilter("");
              }}
              className="w-40 border-0 bg-transparent p-0"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {labelFor(s)}
                </option>
              ))}
            </Select>
          </Label>
          <Label className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
            Published
            <Select
              value={publishedFilter}
              onChange={(e) => {
                setPublishedFilter(e.target.value);
                setStatusFilter("");
              }}
              className="w-40 border-0 bg-transparent p-0"
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Unpublished</option>
            </Select>
          </Label>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-body-sm text-muted">
            Loading activities…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <p className="text-body-sm text-ink">No activities found.</p>
            {search ? (
              <p className="mt-2 text-body-sm text-muted">Try clearing the search.</p>
            ) : (
              <p className="mt-2 text-body-sm text-muted">Add your first activity to get started.</p>
            )}
          </div>
        ) : (
          <table className="w-full text-left divide-y divide-line">
            <thead>
              <tr className="bg-surface text-label-sm text-muted uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold text-ink">Activity</th>
                <th className="px-6 py-3 font-semibold text-ink">Category</th>
                <th className="px-6 py-3 font-semibold text-ink">Date</th>
                <th className="px-6 py-3 font-semibold text-ink">Slots</th>
                <th className="px-6 py-3 font-semibold text-ink">Status</th>
                <th className="px-6 py-3 font-semibold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((activity) => (
                <tr key={activity.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-body-sm font-semibold text-ink">{activity.title}</p>
                    <p className="text-xs text-muted">{activity.organizer}</p>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink">{labelFor(activity.category)}</td>
                  <td className="px-6 py-4 text-body-sm text-ink">
                    {formatDate(activity.startDate)}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink">{activity.totalSlots}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                        activity.status === "published"
                          ? "bg-success/10 text-success border border-success/20"
                          : activity.status === "scheduled"
                            ? "bg-accent/10 text-ink border border-accent/20"
                            : "bg-muted/10 text-muted border border-muted/20",
                      )}
                    >
                      {labelFor(activity.status)}
                    </span>
                    {activity.published ? (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium bg-success/10 text-success border border-success/20">
                        Public
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium bg-danger/10 text-danger border border-danger/20">
                        Private
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(activity)}
                        disabled={saving || deletingId !== null}
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublish(activity.id, activity.published, activity.title)}
                        disabled={saving || deletingId !== null}
                        title={activity.published ? "Unpublish" : "Publish"}
                      >
                        {activity.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(activity.id, activity.title)}
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
        <h2 className="text-headline-sm font-semibold text-ink mb-4">Publishing guide</h2>
        <ul className="space-y-3 text-body-sm text-muted list-disc list-inside">
          <li>
            Set status to <span className="font-semibold text-ink">published</span> and toggle
            <span className="font-semibold text-ink">Publish publicly</span> to make the activity visible on the
            public website.
          </li>
          <li>
            Use <span className="font-semibold text-ink">scheduled</span> with a future
            <span className="font-semibold text-ink">Schedule publication</span> date to auto-publish later.
          </li>
          <li>
            Unpublished activities remain visible to administrators but are hidden from the public.
          </li>
          <li>
            Enable <span className="font-semibold text-ink">Enable applications</span> to allow students to apply.
          </li>
        </ul>
      </div>
    </div>
  );
}
