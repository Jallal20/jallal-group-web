import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";
import { requireAdmin, hasPermission } from "@/lib/auth";
import { BackendNotConfiguredError, listAdminProfiles } from "@/lib/admin-profiles";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

export const metadata: Metadata = { title: "Administrators" };
export const dynamic = "force-dynamic";

const STATUSES = ["active", "suspended"] as const;
const ROLES = [
  "admin",
  "jallal-tech-admin",
  "jallal-institute-admin",
  "jallal-properties-admin",
  "elevate-360-admin",
  "content-editor",
] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; role?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim() || undefined;
  const role = (params.role ?? "").trim() || undefined;

  let items: Awaited<ReturnType<typeof listAdminProfiles>>["items"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const result = await listAdminProfiles({ search: q, status, role, limit: 100 });
    items = result.items;
    total = result.total;
  } catch (caught) {
    error =
      caught instanceof BackendNotConfiguredError
        ? "The Appwrite backend is not configured for this deployment."
        : "Administrators could not be loaded right now.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">User Management</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Administrator Management
        </h1>
        <p className="text-body-md text-muted">
          Create, edit, suspend and manage Jallal Group administrator accounts.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-5 text-body-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder="Search by name, email or role…"
            className="w-full md:w-80"
          />
          <Button
            href="/admin/admin-profiles/new"
            variant="secondary"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Administrator
          </Button>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-96 md:flex-row md:items-end">
          <Select className="w-full md:w-40">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
          <Select className="w-full md:w-48">
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </div>
      </div>

      {!error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
            <Trash2 className="h-6 w-6" />
          </span>
          <p className="text-body-md text-ink">No administrators match.</p>
          <p className="max-w-md text-body-sm text-muted">
            {q || status || role
              ? "Try clearing the search or filters."
              : "Add your first administrator to get started."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white shadow-card overflow-hidden">
          {items.map((profile) => (
            <li
              key={profile.id}
              className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-surface lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-title-md font-semibold text-ink">
                    {profile.fullName}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-medium",
                      profile.status === "active"
                        ? "bg-accent/10 text-forest border border-accent/20"
                        : "bg-sunken text-muted border border-white/30",
                    )}
                  >
                    {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                  </span>
                </div>
                <p className="text-body-sm text-muted">{profile.email}</p>
                {profile.phone && (
                  <p className="text-body-sm text-muted">{profile.phone}</p>
                )}
                <p className="max-w-3xl text-body-sm leading-relaxed text-ink/80">
                  <span className="font-semibold text-ink">{profile.role}</span>{" "}
                  {profile.assignedCompany ? `· ${profile.assignedCompany}` : ""}
                </p>
                <p className="text-label-sm text-muted">
                  Permissions: {profile.permissions.join(", ") || "None"} ·{" "}
                  {formatDate(profile.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/admin/admin-profiles/${profile.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 label-caps text-ink transition-colors hover:border-ink"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Permanently delete administrator "${profile.fullName}"? This cannot be undone.`,
                      )
                    ) {
                      fetch(`/api/admin/admin-profiles/${profile.id}`, {
                        method: "DELETE",
                      }).then(async (res) => {
                        if (res.ok) {
                          window.location.reload();
                        } else {
                          alert("Delete failed. Please try again.");
                        }
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 bg-white px-3 py-2 label-caps text-danger transition-colors hover:bg-danger hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-line px-6 py-3 text-label-sm text-muted">
          <span>{total} administrator{total === 1 ? "" : "s"} shown</span>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
