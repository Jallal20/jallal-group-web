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
  ShieldCheck,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  userId: string;
  studentId: string;
  email: string;
  fullName: string;
  phone: string;
  dateOfBirth: string | null;
  gender: string;
  address: string;
  institution: string;
  educationalLevel: string;
  courseOfStudy: string;
  status: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUSES = ["active", "suspended", "inactive"];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TrainingStudentsPage() {
  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/students?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load students.");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Students could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const input: Record<string, unknown> = {
      email: form.get("email") as string,
      fullName: form.get("fullName") as string,
      studentId: form.get("studentId") as string,
      phone: form.get("phone") as string,
      dateOfBirth: form.get("dateOfBirth") as string || null,
      gender: form.get("gender") as string,
      address: form.get("address") as string,
      institution: form.get("institution") as string,
      educationalLevel: form.get("educationalLevel") as string,
      courseOfStudy: form.get("courseOfStudy") as string,
      status: form.get("status") as string,
      emailVerified: form.get("emailVerified") === "on",
      userId: form.get("userId") as string,
    };

    setSaving(true);
    try {
      const method = editing ? "PATCH" : "POST";
      const url = editing
        ? `/api/admin/students/${editing.id}`
        : "/api/admin/students";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save student.");
      }
      setEditing(null);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
      await fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save student.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete student.");
      await fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete student.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update student status.");
      await fetchStudents();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update student.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Student Management</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Students
          </h1>
          <p className="text-body-md text-muted">
            Manage registered students, view profiles, and suspend or reactivate
            accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="accent" size="sm" disabled={loading} onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
          {open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted hover:text-ink">
                  ×
                </button>
                <h2 className="text-headline-sm font-semibold text-ink mb-2">{editing ? "Edit Student" : "Add Student"}</h2>
                <p className="text-body-sm text-muted mb-6">
                  Register a new student or update an existing student record.
                </p>
                <form onSubmit={handleSave} className="space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" ref={nameRef} defaultValue={editing?.fullName ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input id="email" type="email" defaultValue={editing?.email ?? ""} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input id="studentId" defaultValue={editing?.studentId ?? ""} required placeholder="JGT-2026-0001" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue={editing?.phone ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="institution">Institution / school</Label>
                    <Input id="institution" defaultValue={editing?.institution ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="courseOfStudy">Course of study</Label>
                    <Input id="courseOfStudy" defaultValue={editing?.courseOfStudy ?? ""} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue={editing?.status ?? "active"} id="status">
                      <option value="">Select status</option>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="flex items-center gap-2">
                      <Checkbox id="emailVerified" defaultChecked={Boolean(editing?.emailVerified)} />
                      Email verified
                    </Label>
                  </div>
                </form>
                <div className="flex flex-row-reverse gap-2 mt-6 pt-6 border-t border-line">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Update student" : "Create student"}
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
            placeholder="Search students by name, email, or student ID…"
            className="flex-1 bg-transparent border-0 outline-none text-body-sm"
          />
        </div>
        <div className="px-6 py-3 border-b border-line flex items-center gap-4">
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
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-body-sm text-muted">
            Loading students…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <User className="h-6 w-6" />
            </div>
            <p className="text-body-sm text-ink">No students found.</p>
            {search ? (
              <p className="mt-2 text-body-sm text-muted">Try clearing the search.</p>
            ) : (
              <p className="mt-2 text-body-sm text-muted">
                Registered students will appear here.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-left divide-y divide-line">
            <thead>
              <tr className="bg-surface text-label-sm text-muted uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold text-ink">Student</th>
                <th className="px-6 py-3 font-semibold text-ink">Student ID</th>
                <th className="px-6 py-3 font-semibold text-ink">Email</th>
                <th className="px-6 py-3 font-semibold text-ink">Institution</th>
                <th className="px-6 py-3 font-semibold text-ink">Status</th>
                <th className="px-6 py-3 font-semibold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((student) => (
                <tr key={student.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-semibold text-ink truncate">
                          {student.fullName}
                        </p>
                        <p className="text-xs text-muted truncate">{student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink font-mono">{student.studentId}</td>
                  <td className="px-6 py-4 text-body-sm text-ink">{student.email}</td>
                  <td className="px-6 py-4 text-body-sm text-muted">{student.institution || "—"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                        student.status === "active"
                          ? "bg-success/10 text-success border border-success/20"
                          : student.status === "suspended"
                            ? "bg-danger/10 text-danger border border-danger/20"
                            : "bg-muted/10 text-muted border border-muted/20",
                      )}
                    >
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                    {student.emailVerified ? (
                      <span className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium bg-success/10 text-success border border-success/20">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    ) : null}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(student)}
                        disabled={saving || deletingId !== null}
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetStatus(student.id, student.status === "active" ? "suspended" : "active")}
                        disabled={saving || deletingId !== null}
                        title={student.status === "active" ? "Suspend" : "Reactivate"}
                      >
                        {student.status === "active" ? <ShieldCheck className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(student.id, student.fullName)}
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
        <h2 className="text-headline-sm font-semibold text-ink mb-4">Student ID format</h2>
        <p className="text-body-sm text-muted">
          Each student receives a unique ID in the format{" "}
          <span className="font-mono text-ink">JGT-2026-0001</span>. IDs are
          generated automatically and cannot be duplicated.
        </p>
      </div>
    </div>
  );
}
