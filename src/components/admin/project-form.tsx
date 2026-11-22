"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

const STATUSES = ["planned", "in-development", "completed", "on-hold"] as const;

type ProjectFormValues = {
  name: string;
  slug: string;
  description: string;
  objectives: string;
  category: string;
  imageIds: string;
  status: string;
  launchDate: string;
  participationInfo: string;
  featured: boolean;
  published: boolean;
};

interface ProjectFormBaseProps {
  values: ProjectFormValues;
  errors: Record<string, string>;
  status: "idle" | "submitting" | "success";
  serverError: string | null;
  deleting: boolean;
  onUpdate: (field: keyof ProjectFormValues, value: unknown) => void;
  onDelete: () => Promise<void>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  endpoint: string;
  itemName: string;
}

export function ProjectFormBase({ values, errors, status, serverError, deleting, onUpdate, onDelete, onSubmit, endpoint, itemName }: ProjectFormBaseProps) {
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
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
              {itemName} updated
            </h3>
            <p className="text-body-md leading-relaxed text-muted">
              Changes have been saved successfully.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Project Name" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => onUpdate("name", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Slug" htmlFor="slug" required error={errors.slug}
              hint="URL-friendly identifier, e.g. founders-connect">
              <Input
                id="slug"
                value={values.slug}
                onChange={(e) => onUpdate("slug", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Category" htmlFor="category" required>
              <Input
                id="category"
                value={values.category}
                onChange={(e) => onUpdate("category", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Status" htmlFor="status" required>
              <Select
                id="status"
                value={values.status}
                onChange={(e) => onUpdate("status", e.target.value)}
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

          <Field
            label="Description"
            htmlFor="description"
            required
            error={errors.description}
            hint="Describe the project and its purpose."
          >
            <Textarea
              id="description"
              rows={4}
              value={values.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field
            label="Objectives"
            htmlFor="objectives"
            hint="What does this project aim to achieve?"
          >
            <Textarea
              id="objectives"
              rows={3}
              value={values.objectives}
              onChange={(e) => onUpdate("objectives", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Launch Date" htmlFor="launchDate">
            <Input
              id="launchDate"
              type="date"
              value={values.launchDate}
              onChange={(e) => onUpdate("launchDate", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field
            label="Image IDs (comma-separated)"
            htmlFor="imageIds"
            hint="Comma-separated image identifiers or URLs."
          >
            <Input
              id="imageIds"
              value={values.imageIds}
              onChange={(e) => onUpdate("imageIds", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field
            label="Participation Information"
            htmlFor="participationInfo"
            hint="How can people participate or get involved?"
          >
            <Textarea
              id="participationInfo"
              rows={3}
              value={values.participationInfo}
              onChange={(e) => onUpdate("participationInfo", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <div className="flex items-start gap-3">
            <input
              id="featured"
              type="checkbox"
              checked={values.featured}
              onChange={(e) => onUpdate("featured", e.target.checked)}
              disabled={status === "submitting"}
              className="mt-1 h-4 w-4 shrink-0 accent-accent"
            />
            <label htmlFor="featured" className="text-body-sm text-muted">
              Featured project
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="published"
              type="checkbox"
              checked={values.published}
              onChange={(e) => onUpdate("published", e.target.checked)}
              disabled={status === "submitting"}
              className="mt-1 h-4 w-4 shrink-0 accent-accent"
            />
            <label htmlFor="published" className="text-body-sm text-muted">
              Publish on public website
              {values.published ? " — visible to visitors" : " — draft only"}
            </label>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-6 border-t border-line">
        <div className="flex gap-3">
          <Link
            href={endpoint}
            className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {itemName.toLowerCase() === "project" ? "projects" : itemName.toLowerCase() + "s"}
          </Link>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting || status === "submitting"}
            className="inline-flex items-center gap-1.5 rounded-md border border-danger/30 bg-white px-3 py-2 label-caps text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting…" : `Delete ${itemName}`}
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
