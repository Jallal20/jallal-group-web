import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import {
  BackendNotConfiguredError,
  listProjects,
} from "@/lib/projects";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { ShowcaseDeleteButton } from "@/components/admin/showcase-delete-button";

export const metadata: Metadata = { title: "Projects & Events Management" };
export const dynamic = "force-dynamic";

const STATUSES = [
  "Upcoming",
  "Planning",
  "In Development",
  "Ongoing",
  "Registration Open",
  "Registration Closed",
  "Completed",
  "Postponed",
  "Cancelled",
];

const TYPES = ["project", "event"];

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; category?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = (params.status ?? "").trim() || undefined;
  const type = (params.type ?? "").trim() || undefined;
  const category = (params.category ?? "").trim() || undefined;

  let items: Awaited<ReturnType<typeof listProjects>>["items"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const result = await listProjects({
      search: q || undefined,
      status: status || undefined,
      type: type || undefined,
      category: category || undefined,
      limit: 100,
    });
    items = result.items;
    total = result.total;
  } catch (caught) {
    error =
      caught instanceof BackendNotConfiguredError
        ? "The Appwrite backend is not configured for this deployment."
        : "Projects could not be loaded right now.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Content</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Projects &amp; Events Management
        </h1>
        <p className="text-body-md text-muted">
          Create, publish and feature projects and upcoming events across the Jallal Group.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-5 text-body-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form
          className="flex w-full flex-col gap-2 md:flex-row md:items-center"
          method="get"
          action="/admin/projects"
        >
          <Input
            name="q"
            placeholder="Search projects..."
            defaultValue={q}
            className="w-full md:w-80"
            aria-label="Search"
          />
          <Select name="status" defaultValue={status ?? ""} className="w-full md:w-40" aria-label="Status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select name="type" defaultValue={type ?? ""} className="w-full md:w-40" aria-label="Type">
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t === "project" ? "Project" : "Event"}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>

        <Button href="/admin/projects/new" variant="secondary" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Project / Event
        </Button>
      </div>

      {!error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-body-md text-ink">No projects match.</p>
          <p className="max-w-md text-body-sm text-muted">
            Add your first project or event to get started.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white shadow-card overflow-hidden">
          {items.map((project) => (
            <li
              key={project.id}
              className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-surface lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-title-md font-semibold text-ink">
                    {project.title}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-medium ${
                      project.published
                        ? "bg-accent/10 text-forest border border-accent/20"
                        : "bg-sunken text-muted border border-white/30"
                    }`}
                  >
                    {project.published ? "Published" : "Draft"}
                  </span>
                  <span className="rounded-sm border border-line bg-surface px-2 py-0.5 text-label-sm font-medium text-muted">
                    {project.type === "event" ? "Event" : "Project"}
                  </span>
                </div>
                <p className="text-body-sm text-muted">{project.category}</p>
                <p className="max-w-3xl text-body-sm leading-relaxed text-ink/80">
                  {project.description.length > 200
                    ? `${project.description.slice(0, 200)}...`
                    : project.description}
                </p>
                <p className="text-label-sm text-muted">
                  {project.status} - Order {project.displayOrder} - Updated {project.updatedAt}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/admin/projects/${project.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 label-caps text-ink transition-colors hover:border-ink"
                >
                  Edit
                </Link>
                <ShowcaseDeleteButton id={project.id} title={project.title} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-line px-6 py-3 text-label-sm text-muted">
          <span>{total} item{total === 1 ? "" : "s"} shown</span>
        </div>
      )}
    </div>
  );
}