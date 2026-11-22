"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Trash2,
  Edit3,
  Search,
  Clock,
  User,
  FileText,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Application = {
  id: string;
  activityId: string;
  activityTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  reference: string;
  formData: Record<string, unknown>;
  fileIds: string[];
  status: string;
  adminNotes: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  decisionMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUSES = [
  "submitted",
  "under-review",
  "shortlisted",
  "approved",
  "rejected",
  "waitlisted",
  "withdrawn",
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(value: string): string {
  return value
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function TrainingApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Review form state
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      if (activityFilter) params.set("activityId", activityFilter);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/applications?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load applications.");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Applications could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, activityFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleView = (app: Application) => {
    setViewing(app);
    setReviewStatus(app.status);
    setReviewNotes(app.adminNotes);
    setReviewMessage(app.decisionMessage ?? "");
    setOpen(true);
  };

  const handleStatusChange = async () => {
    if (!viewing) return;
    setSavingId(viewing.id);
    try {
      const res = await fetch(`/api/admin/applications/${viewing.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          adminNotes: reviewNotes,
          decisionMessage: reviewMessage || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update status.");
      }
      setViewing(null);
      setOpen(false);
      await fetchApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Application Management</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Applications
          </h1>
          <p className="text-body-md text-muted">
            Review, shortlist, approve, or reject student applications for
            training programs.
          </p>
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
              placeholder="Search by name, email, or reference…"
              className="flex-1 bg-transparent border-0 outline-none text-body-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <Label className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
              Status
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-48 border-0 bg-transparent p-0"
              >
                <option value="">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </Select>
            </Label>
            <Label className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
              Activity
              <Select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="w-48 border-0 bg-transparent p-0"
              >
                <option value="">All activities</option>
                {[...new Set(items.map((a) => a.activityTitle))].map((title) => (
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
            Loading applications…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-body-sm text-ink">No applications found.</p>
            {search ? (
              <p className="mt-2 text-body-sm text-muted">Try clearing the search.</p>
            ) : (
              <p className="mt-2 text-body-sm text-muted">
                Applications submitted by students will appear here.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-left divide-y divide-line">
            <thead>
              <tr className="bg-surface text-label-sm text-muted uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold text-ink">Applicant</th>
                <th className="px-6 py-3 font-semibold text-ink">Program</th>
                <th className="px-6 py-3 font-semibold text-ink">Reference</th>
                <th className="px-6 py-3 font-semibold text-ink">Date</th>
                <th className="px-6 py-3 font-semibold text-ink">Status</th>
                <th className="px-6 py-3 font-semibold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-surface/50 transition-colors cursor-pointer"
                  onClick={() => handleView(app)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-semibold text-ink truncate">
                          {app.studentName}
                        </p>
                        <p className="text-xs text-muted truncate">{app.studentEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink truncate">{app.activityTitle}</td>
                  <td className="px-6 py-4 text-body-sm text-ink font-mono">{app.reference}</td>
                  <td className="px-6 py-4 text-body-sm text-ink">{formatDate(app.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                        app.status === "approved"
                          ? "bg-success/10 text-success border border-success/20"
                          : app.status === "rejected"
                            ? "bg-danger/10 text-danger border border-danger/20"
                            : app.status === "shortlisted"
                              ? "bg-accent/10 text-ink border border-accent/20"
                              : app.status === "waitlisted"
                                ? "bg-muted/10 text-muted border border-muted/20"
                                : "bg-surface/50 text-muted border border-line",
                      )}
                    >
                      {statusLabel(app.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ChevronRight className="h-4 w-4 text-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
              ×
            </button>
            <h2 className="text-headline-sm font-semibold text-ink mb-2">Application {viewing.reference}</h2>
            <p className="text-body-sm text-muted mb-6">
              Review applicant details and update the application status.
            </p>
            <div className="space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-label-sm text-muted uppercase tracking-wider">Program</Label>
                  <p className="text-body-sm font-semibold text-ink">{viewing.activityTitle}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-label-sm text-muted uppercase tracking-wider">Reference</Label>
                  <p className="text-body-sm font-mono text-ink">{viewing.reference}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-label-sm text-muted uppercase tracking-wider">Applicant</Label>
                  <p className="text-body-sm font-semibold text-ink">{viewing.studentName}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-label-sm text-muted uppercase tracking-wider">Email</Label>
                  <p className="text-body-sm text-ink">{viewing.studentEmail}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-label-sm text-muted uppercase tracking-wider">Submitted</Label>
                  <p className="text-body-sm text-ink">{formatDate(viewing.createdAt ?? null)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-label-sm text-muted uppercase tracking-wider">Current status</Label>
                  <p className="text-body-sm font-semibold text-ink">{statusLabel(viewing.status ?? "")}</p>
                </div>
              </div>

              {Object.keys(viewing.formData).length > 0 && (
                <div className="border-t border-line pt-5">
                  <h3 className="text-label-sm text-muted uppercase tracking-wider mb-3">Application details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-body-sm">
                    {Object.entries(viewing.formData).map(([key, value]) => (
                      <div key={key} className="bg-surface/50 rounded-lg p-3">
                        <p className="text-xs text-muted uppercase tracking-wider mb-1">{key}</p>
                        <p className="text-body-sm text-ink whitespace-pre-line break-words">
                          {String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewing.fileIds.length > 0 && (
                <div className="border-t border-line pt-5">
                  <h3 className="text-label-sm text-muted uppercase tracking-wider mb-3">Uploaded documents</h3>
                  <div className="space-y-2">
                    {viewing.fileIds.map((fileId) => (
                      <div key={fileId} className="flex items-center gap-2 text-body-sm">
                        <FileText className="h-4 w-4 text-muted shrink-0" />
                        <span className="text-ink truncate">Document {fileId.slice(0, 8)}…</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-line pt-5">
                <h3 className="text-label-sm text-muted uppercase tracking-wider mb-3">Review decision</h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reviewStatus">New status</Label>
                    <Select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)} className="w-full" id="reviewStatus">
                      <option value="">Select status</option>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reviewNotes">Admin notes (internal)</Label>
                    <Textarea
                      id="reviewNotes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      placeholder="Internal notes about this application…"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reviewMessage">Decision message (sent to student)</Label>
                    <Textarea
                      id="reviewMessage"
                      value={reviewMessage}
                      onChange={(e) => setReviewMessage(e.target.value)}
                      rows={3}
                      placeholder="Message the student will see in their dashboard…"
                    />
                  </div>
                  <div className="flex flex-row-reverse gap-2 mt-6 pt-6 border-t border-line">
                    <Button type="button" onClick={handleStatusChange} disabled={savingId !== null}>
                      {savingId !== null ? "Updating…" : "Update status"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
