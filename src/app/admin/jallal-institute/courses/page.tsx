import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";
import { requireAdmin, hasPermission } from "@/lib/auth";
import { BackendNotConfiguredError, listCourses } from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { SectionHeading, Eyebrow } from "@/components/ui/typography";

export const metadata: Metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

const STATUSES = ["available", "full", "closed"] as const;

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

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status =
    params.status && STATUSES.includes(params.status as typeof STATUSES[number])
      ? (params.status as typeof STATUSES[number])
      : undefined;
  const category = (params.category ?? "").trim() || undefined;

  let items: Awaited<ReturnType<typeof listCourses>>["items"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const result = await listCourses({ search: q, status, category, limit: 100 });
    items = result.items;
    total = result.total;
  } catch (caught) {
    error =
      caught instanceof BackendNotConfiguredError
        ? "The Appwrite backend is not configured for this deployment."
        : "Courses could not be loaded right now.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Jallal Institute of Technology</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Course Management
        </h1>
        <p className="text-body-md text-muted">
          Manage technical training courses, fees, capacity and publication status.
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
            placeholder="Search by course name, code…"
            className="w-full md:w-80"
          />
          <Button
            href="/admin/jallal-institute/courses/new"
            variant="secondary"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Course
          </Button>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-96 md:flex-row md:items-end">
          <Select
            className="w-full md:w-40"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
          <Select className="w-full md:w-48">
            <option value="">All categories</option>
            {[...new Set(items.map((i) => i.category))].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
      </div>

      {!error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
            <Trash2 className="h-6 w-6" />
          </span>
          <p className="text-body-md text-ink">No courses match.</p>
          <p className="max-w-md text-body-sm text-muted">
            {q || status || category
              ? "Try clearing the search or filters."
              : "Add your first course to get started."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white shadow-card overflow-hidden">
          {items.map((course) => (
            <li
              key={course.id}
              className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-surface lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/courses/${course.code}`}
                    className="text-title-md font-semibold text-ink underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    {course.name}
                  </Link>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-medium",
                      course.published
                        ? "bg-accent/10 text-forest border border-accent/20"
                        : "bg-sunken text-muted border border-white/30",
                    )}
                  >
                    {course.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-body-sm text-muted">{course.code} · {course.category}</p>
                <p className="max-w-3xl text-body-sm leading-relaxed text-ink/80">
                  {course.description.length > 200
                    ? `${course.description.slice(0, 200)}…`
                    : course.description}
                </p>
                <p className="text-label-sm text-muted">
                  {formatCurrency(course.fee, course.currency)} ·
                  {course.status} ·
                  {course.capacity > 0 ? `${course.capacity} seats` : "Open capacity"} ·
                  {formatDate(course.createdAt)}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/admin/jallal-institute/courses/${course.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 label-caps text-ink transition-colors hover:border-ink"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Permanently delete "${course.name}"? This cannot be undone.`,
                      )
                    ) {
                      fetch(`/api/admin/courses/${course.id}`, {
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
          <span>{total} course{total === 1 ? "" : "s"} shown</span>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
