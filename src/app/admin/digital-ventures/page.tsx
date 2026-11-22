import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Trash2 } from "lucide-react";
import { requireAdmin, hasPermission } from "@/lib/auth";
import { BackendNotConfiguredError, listDigitalVentures, deleteDigitalVenture } from "@/lib/digital-ventures";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

export const metadata: Metadata = { title: "Digital Ventures" };
export const dynamic = "force-dynamic";

const STATUSES = ["planning", "in-development", "testing", "launched", "paused"] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function DigitalVenturesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim() || undefined;
  const category = (params.category ?? "").trim() || undefined;

  let items: Awaited<ReturnType<typeof listDigitalVentures>>["items"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const result = await listDigitalVentures({ search: q, status, category, limit: 100 });
    items = result.items;
    total = result.total;
  } catch (caught) {
    error =
      caught instanceof BackendNotConfiguredError
        ? "The Appwrite backend is not configured for this deployment."
        : "Digital ventures could not be loaded right now.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Digital Ventures</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Digital Venture Management
        </h1>
        <p className="text-body-md text-muted">
          Manage Jallal Pay, Waka Salone, First Home and future digital ventures.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-5 text-body-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
          <Input placeholder="Search by venture name…" className="w-full md:w-80" />
          <Button
            href="/admin/digital-ventures/new"
            variant="secondary"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Venture
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
        </div>
      </div>

      {!error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
            <Trash2 className="h-6 w-6" />
          </span>
          <p className="text-body-md text-ink">No digital ventures match.</p>
          <p className="max-w-md text-body-sm text-muted">
            {q || status || category
              ? "Try clearing the search or filters."
              : "Add your first digital venture to get started."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white shadow-card overflow-hidden">
          {items.map((venture) => (
            <li
              key={venture.id}
              className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-surface lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-title-md font-semibold text-ink">
                    {venture.name}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-medium",
                      venture.published
                        ? "bg-accent/10 text-forest border border-accent/20"
                        : "bg-sunken text-muted border border-white/30",
                    )}
                  >
                    {venture.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-body-sm text-muted">{venture.category}</p>
                <p className="max-w-3xl text-body-sm leading-relaxed text-ink/80">
                  {venture.description.length > 200
                    ? `${venture.description.slice(0, 200)}…`
                    : venture.description}
                </p>
                <p className="text-label-sm text-muted">
                  {venture.status} · {formatDate(venture.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <a
                  href={`/admin/digital-ventures/${venture.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 label-caps text-ink transition-colors hover:border-ink"
                >
                  Edit
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Permanently delete "${venture.name}"? This cannot be undone.`,
                      )
                    ) {
                      deleteDigitalVenture(venture.id).then(() => {
                        window.location.reload();
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
          <span>{total} venture{total === 1 ? "" : "s"} shown</span>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

