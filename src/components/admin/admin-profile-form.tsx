"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

const STATUSES = ["active", "suspended"] as const;
const ROLES = [
  "admin",
  "jallal-tech-admin",
  "jallal-institute-admin",
  "jallal-properties-admin",
  "elevate-360-admin",
  "content-editor",
] as const;

const PERMISSIONS = [
  "companies.manage",
  "properties.manage",
  "propertyProjects.manage",
  "courses.manage",
  "enrollments.manage",
  "elevateProjects.manage",
  "techProjects.manage",
  "auditLogs.view",
  "users.manage",
  "settings.manage",
  "content.manage",
] as const;

type AdminProfileFormValues = {
  adminId: string;
  email: string;
  fullName: string;
  phone: string;
  assignedCompany: string;
  role: string;
  status: string;
  permissions: string[];
};

interface AdminProfileFormProps {
  profile: {
    id: string;
    adminId: string;
    email: string;
    fullName: string;
    phone: string;
    assignedCompany: string;
    role: string;
    status: string;
    permissions: string[];
  };
}

export function AdminProfileForm({ profile }: AdminProfileFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<AdminProfileFormValues>({
    adminId: profile.adminId,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone,
    assignedCompany: profile.assignedCompany,
    role: profile.role,
    status: profile.status,
    permissions: profile.permissions,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.replace("/admin/admin-profiles");
        router.refresh();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  function update(field: keyof AdminProfileFormValues, value: unknown) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setServerError(null);
  }

  function togglePermission(permission: string) {
    setValues((current) => {
      const next = current.permissions.includes(permission)
        ? current.permissions.filter((p) => p !== permission)
        : [...current.permissions, permission];
      return { ...current, permissions: next };
    });
    setServerError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!values.adminId.trim()) nextErrors.adminId = "Administrator ID is required.";
    if (!values.email.trim()) nextErrors.email = "Email address is required.";
    if (!values.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!values.role) nextErrors.role = "Role is required.";
    if (!values.status) nextErrors.status = "Status is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setServerError(null);

    try {
      const response = await fetch(`/api/admin/admin-profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (response.ok && payload.ok) {
        setStatus("success");
        return;
      }

      setServerError(payload.message ?? "Failed to update administrator.");
      setStatus("idle");
    } catch {
      setServerError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Permanently delete administrator "${profile.fullName}"? This cannot be undone.`,
      )
    )
      return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/admin-profiles/${profile.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.replace("/admin/admin-profiles");
        router.refresh();
      } else {
        alert("Delete failed. Please try again.");
        setDeleting(false);
      }
    } catch {
      alert("Network error. Delete failed.");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {serverError ? (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger-soft/60 p-4 text-body-sm text-ink"
        >
          {serverError}
        </div>
      ) : null}

      {status === "success" ? (
        <div
          role="status"
          className="flex flex-col items-start gap-4 rounded-lg border border-accent/40 bg-success-soft/50 p-6"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-success">
            <span className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-2">
            <h3 className="text-headline-sm font-semibold text-ink">
              Administrator updated
            </h3>
            <p className="text-body-md leading-relaxed text-muted">
              Changes have been saved successfully.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Administrator ID" htmlFor="adminId" required error={errors.adminId}>
              <Input
                id="adminId"
                value={values.adminId}
                onChange={(e) => update("adminId", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Email Address" htmlFor="email" required error={errors.email}>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => update("email", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Full Name" htmlFor="fullName" required error={errors.fullName}>
              <Input
                id="fullName"
                value={values.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Phone Number" htmlFor="phone">
              <Input
                id="phone"
                type="tel"
                value={values.phone}
                onChange={(e) => update("phone", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Assigned Company" htmlFor="assignedCompany">
              <Select
                id="assignedCompany"
                value={values.assignedCompany}
                onChange={(e) => update("assignedCompany", e.target.value)}
                disabled={status === "submitting"}
              >
                <option value="">None (super admin)</option>
                <option value="Jallal Tech">Jallal Tech</option>
                <option value="Jallal Institute of Technology">Jallal Institute of Technology</option>
                <option value="Jallal Properties Group">Jallal Properties Group</option>
                <option value="Elevate 360">Elevate 360</option>
              </Select>
            </Field>

            <Field label="Role" htmlFor="role" required error={errors.role}>
              <Select
                id="role"
                value={values.role}
                onChange={(e) => update("role", e.target.value)}
                disabled={status === "submitting"}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </Field>

            <Field label="Status" htmlFor="status" required error={errors.status}>
              <Select
                id="status"
                value={values.status}
                onChange={(e) => update("status", e.target.value)}
                disabled={status === "submitting"}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Permissions" htmlFor="permissions"
            hint="Select granular permissions for this administrator.">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {PERMISSIONS.map((permission) => {
                const isChecked = values.permissions.includes(permission);
                return (
                  <label key={permission} className="flex items-center gap-2 p-3 rounded-md border border-line bg-white hover:bg-surface/50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePermission(permission)}
                      className="h-4 w-4 shrink-0 accent-accent"
                    />
                    <span className="text-body-sm text-ink">{permission}</span>
                  </label>
                );
              })}
            </div>
          </Field>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-6 border-t border-line">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.replace("/admin/admin-profiles")}
            disabled={status === "submitting"}
          >
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || status === "submitting"}
            className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 bg-white px-3 py-2 label-caps text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting…" : "Delete Administrator"}
          </button>
        </div>
        <Button
          type="submit"
          disabled={status === "submitting"}
          className="w-full sm:w-auto"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}

