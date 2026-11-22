import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";
import { requireAdmin, hasPermission } from "@/lib/auth";
import { BackendNotConfiguredError, listProperties } from "@/lib/properties";
import type { PropertyCategory, PropertyStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { SectionHeading, Eyebrow } from "@/components/ui/typography";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Properties" };
export const dynamic = "force-dynamic";

const STATUSES: PropertyStatus[] = ["available", "sold", "rented", "off-market"];
const CATEGORIES: PropertyCategory[] = [
  "lands-for-sale",
  "residential-properties",
  "houses-for-sale",
  "houses-for-rent",
  "commercial-properties",
  "real-estate-development-projects",
  "upcoming-major-projects",
];

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status =
    params.status && STATUSES.includes(params.status as PropertyStatus)
      ? (params.status as PropertyStatus)
      : undefined;
  const category =
    params.category && CATEGORIES.includes(params.category as PropertyCategory)
      ? (params.category as PropertyCategory)
      : undefined;

  let items: Awaited<ReturnType<typeof listProperties>>["items"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const result = await listProperties({ search: q, status, category, limit: 100 });
    items = result.items;
    total = result.total;
  } catch (caught) {
    error =
      caught instanceof BackendNotConfiguredError
        ? "The Appwrite backend is not configured for this deployment."
        : "Properties could not be loaded right now.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Jallal Properties Group</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Property Management
        </h1>
        <p className="text-body-md text-muted">
          Manage residential, commercial, land and development property listings.
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
            placeholder="Search by title, location, district…"
            className="w-full md:w-80"
          />
          <Button
            href="/admin/jallal-properties/properties/new"
            variant="secondary"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Property
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
            <option value="">All categories</option>
            {CATEGORIES.map((c) => {
              const label = c
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
              return <option key={c} value={c}>{label}</option>;
            })}
          </Select>
        </div>
      </div>

      {!error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
            <Trash2 className="h-6 w-6" />
          </span>
          <p className="text-body-md text-ink">No properties match.</p>
          <p className="max-w-md text-body-sm text-muted">
            {q || status || category
              ? "Try clearing the search or filters."
              : "Add your first property listing to get started."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white shadow-card overflow-hidden">
          {items.map((property) => (
            <li
              key={property.id}
              className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-surface lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/properties/${property.slug}`}
                    className="text-title-md font-semibold text-ink underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {property.title}
                  </Link>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-medium",
                      property.published
                        ? "bg-accent/10 text-forest border border-accent/20"
                        : "bg-sunken text-muted border border-white/30",
                    )}
                  >
                    {property.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-body-sm text-muted">
                  {property.location}{property.district ? `, ${property.district}` : ""}
                </p>
                <p className="max-w-3xl text-body-sm leading-relaxed text-ink/80">
                  {property.description.length > 200
                    ? `${property.description.slice(0, 200)}…`
                    : property.description}
                </p>
                <p className="text-label-sm text-muted">
                  {formatCurrency(property.price, property.currency)} ·
                  {property.status} ·
                  {formatDate(property.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/admin/jallal-properties/properties/${property.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 label-caps text-ink transition-colors hover:border-ink"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Permanently delete "${property.title}"? This cannot be undone.`,
                      )
                    ) {
                      fetch(`/api/admin/properties/${property.id}`, {
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
          <span>{total} propert{total === 1 ? "y" : "ies"} shown</span>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
