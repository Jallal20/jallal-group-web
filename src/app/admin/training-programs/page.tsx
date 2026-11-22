"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  Save,
  X,
  User,
  GraduationCap,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Enrollment = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  activityId: string;
  activityTitle: string;
  applicationId: string | null;
  schedule: string;
  instructor: string;
  notes: string;
  status: string;
  enrolledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUSES = ["pending", "active", "completed", "suspended", "withdrawn"];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TrainingProgramsPage() {
  const [items, setItems] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Enrollment | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      if (activityFilter) params.set("activityId", activityFilter);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/program-enrollments?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load enrollments.");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enrollments could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, activityFilter]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const input: Record<string, unknown> = {
      studentId: form.get("studentId") as string,
      studentName: form.get("studentName") as string,
      studentEmail: form.get("studentEmail") as string,
      activityId: form.get("activityId") as string,
      activityTitle: form.get("activityTitle") as string,
      applicationId: form.get("applicationId") as string || null,
      schedule: form.get("schedule") as string,
      instructor: form.get("instructor") as string,
      notes: form.get("notes") as string,
      status: form.get("status") as string,
    };

    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `/api/admin/program-enrollments?id=${editing.id}`
        : "/api/admin/program-enrollments";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save enrollment.");
      }
      setEditing(null);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
      await fetchEnrollments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save enrollment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete enrollment for "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/program-enrollments?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete enrollment.");
      await fetchEnrollments();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete enrollment.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Program Enrollments</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Program Enrollments
          </h1>
          <p className="text-body-md text-muted">
            Manage student enrollment in approved training programs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="accent" size="sm" disabled={loading} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Enroll Student
          </Button>
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
                  ×
                </button>
                <h2 className="text-headline-sm font-semibold text-ink mb-2">{editing ? "Edit Enrollment" : "Enroll Student"}</h2>
                <p className="text-body-sm text-muted mb-6">
                  Assign a student to a program and set their enrollment status.
                </p>
                <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="studentName">Student name</Label>
                    <Input id="studentName" defaultValue={editing?.studentName ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="studentEmail">Student email</Label>
                    <Input id="studentEmail" type="email" defaultValue={editing?.studentEmail ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input id="studentId" defaultValue={editing?.studentId ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="activityTitle">Program title</Label>
                    <Input id="activityTitle" defaultValue={editing?.activityTitle ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="activityId">Activity ID</Label>
                    <Input id="activityId" defaultValue={editing?.activityId ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="applicationId">Application ID (optional)</Label>
                    <Input id="applicationId" defaultValue={editing?.applicationId ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="instructor">Instructor</Label>
                    <Input id="instructor" defaultValue={editing?.instructor ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="schedule">Schedule</Label>
                    <Input id="schedule" defaultValue={editing?.schedule ?? ""} placeholder="e.g. Mon-Fri 9am-4pm" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" defaultValue={editing?.notes ?? ""} rows={3} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue={editing?.status ?? "pending"} id="status">
                      <option value="">Select status</option>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                </form>
                <div className="flex flex-row-reverse gap-2 mt-6 pt-6 border-t border-line">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Update enrollment" : "Enroll student"}
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
        <div className="border-b border-line px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Search className="h-4 w-4 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, or program…"
              className="flex-1 bg-transparent border-0 outline-none text-body-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <Label className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
              Status
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40 border-0 bg-transparent p-0"
              >
                <option value="">All</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </Label>
            <Label className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
              Program
              <Select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-40 border-0 bg-transparent p-0"
              >
                <option value="">All</option>
                {[...new Set(items.map((e) => e.activityTitle))].map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </Select>
            </Label>
          </div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-body-sm text-muted">
            Loading enrollments…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <GraduationCap className="h-6 w-6" />
            </div>
            <p className="text-body-sm text-ink">No enrollments found.</p>
            {search ? (
              <p className="mt-2 text-body-sm text-muted">Try clearing the search.</p>
            ) : (
              <p className="mt-2 text-body-sm text-muted">
                Approved students enrolled in programs will appear here.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-left divide-y divide-line">
            <thead>
              <tr className="bg-surface text-label-sm text-muted uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold text-ink">Student</th>
                <th className="px-6 py-3 font-semibold text-ink">Student ID</th>
                <th className="px-6 py-3 font-semibold text-ink">Program</th>
                <th className="px-6 py-3 font-semibold text-ink">Instructor</th>
                <th className="px-6 py-3 font-semibold text-ink">Enrolled</th>
                <th className="px-6 py-3 font-semibold text-ink">Status</th>
                <th className="px-6 py-3 font-semibold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((enrollment) => (
                <tr key={enrollment.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-semibold text-ink truncate">
                          {enrollment.studentName}
                        </p>
                        <p className="text-xs text-muted truncate">{enrollment.studentEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink font-mono">{enrollment.studentId}</td>
                  <td className="px-6 py-4 text-body-sm text-ink truncate">{enrollment.activityTitle}</td>
                  <td className="px-6 py-4 text-body-sm text-muted">{enrollment.instructor || "—"}</td>
                  <td className="px-6 py-4 text-body-sm text-ink">{formatDate(enrollment.enrolledAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                        enrollment.status === "active"
                          ? "bg-success/10 text-success border border-success/20"
                          : enrollment.status === "completed"
                            ? "bg-accent/10 text-ink border border-accent/20"
                            : enrollment.status === "suspended"
                              ? "bg-danger/10 text-danger border border-danger/20"
                              : enrollment.status === "withdrawn"
                                ? "bg-muted/10 text-muted border border-muted/20"
                                : "bg-surface/50 text-muted border border-line",
                      )}
                    >
                      {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(enrollment)}
                        disabled={saving || deletingId !== null}
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(enrollment.id, enrollment.studentName)}
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
