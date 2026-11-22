"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { SHOWCASE_STATUSES, SHOWCASE_CONTENT_TYPES } from "@/lib/types";

const CATEGORIES = [
  "New Projects",
  "Upcoming Projects",
  "Ongoing Projects",
  "Completed Projects",
  "Product Launches",
  "Upcoming Events",
  "Conferences",
  "Workshops",
  "Boot Camps",
  "Hackathons",
  "Training Programs",
  "Business Initiatives",
  "Partnerships",
  "Company Announcements",
];

type Values = {
  title: string;
  slug: string;
  type: string;
  category: string;
  status: string;
  companyId: string;
  companyName: string;
  description: string;
  objectives: string;
  coverImageId: string;
  eventDate: string;
  endDate: string;
  location: string;
  online: boolean;
  registrationUrl: string;
  registrationOpenAt: string;
  registrationCloseAt: string;
  progress: string;
  featured: boolean;
  displayOrder: string;
  published: boolean;
  publishedAt: string;
  activityId: string;
};

const EMPTY: Values = {
  title: "",
  slug: "",
  type: "project",
  category: CATEGORIES[0],
  status: SHOWCASE_STATUSES[0],
  companyId: "",
  companyName: "",
  description: "",
  objectives: "",
  coverImageId: "",
  eventDate: "",
  endDate: "",
  location: "",
  online: false,
  registrationUrl: "",
  registrationOpenAt: "",
  registrationCloseAt: "",
  progress: "0",
  featured: false,
  displayOrder: "0",
  published: false,
  publishedAt: "",
  activityId: "",
};

export function ShowcaseProjectForm({
  mode,
  projectId,
  initial,
}: {
  mode: "create" | "update";
  projectId?: string;
  initial?: Partial<Values>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  function update(field: keyof Values, value: unknown) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setServerError(null);
  }

  function toIso(value: string): string | null {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!values.title.trim()) nextErrors.title = "Title is required.";
    if (!values.slug.trim()) nextErrors.slug = "Slug is required.";
    if (!values.category) nextErrors.category = "Category is required.";
    if (!values.status) nextErrors.status = "Status is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setServerError(null);

    const payload: Record<string, unknown> = {
      title: values.title.trim(),
      slug: values.slug.trim(),
      type: values.type,
      category: values.category,
      status: values.status,
      companyId: values.companyId,
      companyName: values.companyName,
      description: values.description,
      objectives: values.objectives,
      coverImageId: values.coverImageId,
      eventDate: toIso(values.eventDate),
      endDate: toIso(values.endDate),
      location: values.location,
      online: values.online,
      registrationUrl: values.registrationUrl,
      registrationOpenAt: toIso(values.registrationOpenAt),
      registrationCloseAt: toIso(values.registrationCloseAt),
      progress: Number(values.progress || 0),
      featured: values.featured,
      displayOrder: Number(values.displayOrder || 0),
      published: values.published,
      publishedAt: values.publishedAt ? toIso(values.publishedAt) : null,
      activityId: values.activityId,
    };

    try {
      const url = mode === "create" ? "/api/admin/projects" : `/api/admin/projects/${projectId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };

      if (response.ok && data.ok) {
        router.push("/admin/projects");
        router.refresh();
        return;
      }

      setServerError(data.message ?? "Failed to save project.");
      setStatus("idle");
    } catch {
      setServerError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to projects
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          {mode === "create" ? "Add New Project" : "Edit Project"}
        </h1>
      </div>

      {serverError ? (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger-soft/60 p-4 text-body-sm text-ink"
        >
          {serverError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Title" htmlFor="title" required error={errors.title}>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Slug" htmlFor="slug" required error={errors.slug}>
            <Input
              id="slug"
              value={values.slug}
              onChange={(e) => update("slug", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Type" htmlFor="type">
            <Select
              id="type"
              value={values.type}
              onChange={(e) => update("type", e.target.value)}
              disabled={status === "submitting"}
            >
              {SHOWCASE_CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t === "project" ? "Project" : "Event"}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Category" htmlFor="category" required error={errors.category}>
            <Select
              id="category"
              value={values.category}
              onChange={(e) => update("category", e.target.value)}
              disabled={status === "submitting"}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
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
              {SHOWCASE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Progress (%)" htmlFor="progress">
            <Input
              id="progress"
              type="number"
              min={0}
              max={100}
              value={values.progress}
              onChange={(e) => update("progress", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Related Company" htmlFor="companyName">
            <Input
              id="companyName"
              value={values.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Company ID" htmlFor="companyId">
            <Input
              id="companyId"
              value={values.companyId}
              onChange={(e) => update("companyId", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Display Order" htmlFor="displayOrder">
            <Input
              id="displayOrder"
              type="number"
              value={values.displayOrder}
              onChange={(e) => update("displayOrder", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Cover Image ID" htmlFor="coverImageId">
            <Input
              id="coverImageId"
              value={values.coverImageId}
              onChange={(e) => update("coverImageId", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Location" htmlFor="location">
            <Input
              id="location"
              value={values.location}
              onChange={(e) => update("location", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>
        </div>

        <Field label="Description" htmlFor="description" required error={errors.description}>
          <Textarea
            id="description"
            rows={5}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            disabled={status === "submitting"}
          />
        </Field>

        <Field label="Objectives" htmlFor="objectives">
          <Textarea
            id="objectives"
            rows={4}
            value={values.objectives}
            onChange={(e) => update("objectives", e.target.value)}
            disabled={status === "submitting"}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Event Date" htmlFor="eventDate">
            <Input
              id="eventDate"
              type="datetime-local"
              value={values.eventDate}
              onChange={(e) => update("eventDate", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="End Date" htmlFor="endDate">
            <Input
              id="endDate"
              type="datetime-local"
              value={values.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Registration URL" htmlFor="registrationUrl">
            <Input
              id="registrationUrl"
              value={values.registrationUrl}
              onChange={(e) => update("registrationUrl", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Activity ID" htmlFor="activityId">
            <Input
              id="activityId"
              value={values.activityId}
              onChange={(e) => update("activityId", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Registration Opens At" htmlFor="registrationOpenAt">
            <Input
              id="registrationOpenAt"
              type="datetime-local"
              value={values.registrationOpenAt}
              onChange={(e) => update("registrationOpenAt", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Registration Closes At" htmlFor="registrationCloseAt">
            <Input
              id="registrationCloseAt"
              type="datetime-local"
              value={values.registrationCloseAt}
              onChange={(e) => update("registrationCloseAt", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Published At" htmlFor="publishedAt">
            <Input
              id="publishedAt"
              type="datetime-local"
              value={values.publishedAt}
              onChange={(e) => update("publishedAt", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-body-sm text-ink">
            <input
              type="checkbox"
              checked={values.online}
              onChange={(e) => update("online", e.target.checked)}
              disabled={status === "submitting"}
              className="h-4 w-4 accent-accent"
            />
            Online participation
          </label>
          <label className="flex items-center gap-2 text-body-sm text-ink">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(e) => update("featured", e.target.checked)}
              disabled={status === "submitting"}
              className="h-4 w-4 accent-accent"
            />
            Feature on homepage
          </label>
          <label className="flex items-center gap-2 text-body-sm text-ink">
            <input
              type="checkbox"
              checked={values.published}
              onChange={(e) => update("published", e.target.checked)}
              disabled={status === "submitting"}
              className="h-4 w-4 accent-accent"
            />
            Publish
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/admin/projects")}
            disabled={status === "submitting"}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={status === "submitting"} className="w-full sm:w-auto">
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              "Save Project"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
