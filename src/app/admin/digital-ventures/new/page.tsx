"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

const STATUSES = ["planning", "in-development", "testing", "launched", "paused"] as const;
const CATEGORIES = [
  "FinTech",
  "Mobility",
  "PropTech",
  "HealthTech",
  "AgriTech",
  "Clean Energy",
] as const;

type DigitalVentureFormValues = {
  name: string;
  slug: string;
  description: string;
  category: string;
  status: string;
  imageIds: string;
  websiteUrl: string;
  featured: boolean;
  published: boolean;
};

export default function NewDigitalVenturePage() {
  const router = useRouter();
  const [values, setValues] = useState<DigitalVentureFormValues>({
    name: "",
    slug: "",
    description: "",
    category: CATEGORIES[0],
    status: STATUSES[0],
    imageIds: "",
    websiteUrl: "",
    featured: false,
    published: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  function update(field: keyof DigitalVentureFormValues, value: unknown) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
    setServerError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    if (!values.name.trim()) nextErrors.name = "Venture name is required.";
    if (!values.slug.trim()) nextErrors.slug = "Slug is required.";
    if (!values.description.trim()) nextErrors.description = "Description is required.";
    if (!values.category) nextErrors.category = "Category is required.";
    if (!values.status) nextErrors.status = "Status is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setServerError(null);

    try {
      const response = await fetch("/api/admin/digital-ventures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          imageIds: values.imageIds
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (response.ok && payload.ok) {
        router.replace("/admin/digital-ventures");
        router.refresh();
        return;
      }

      setServerError(payload.message ?? "Failed to create digital venture.");
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
          href="/admin/digital-ventures"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to digital ventures
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Add Digital Venture
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
          <Field label="Venture Name" htmlFor="name" required error={errors.name}>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Slug" htmlFor="slug" required error={errors.slug}
            hint="URL-friendly identifier, e.g. jallal-pay">
            <Input
              id="slug"
              value={values.slug}
              onChange={(e) => update("slug", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Category" htmlFor="category" required error={errors.category}>
            <Select
              id="category"
              value={values.category}
              onChange={(e) => update("category", e.target.value)}
              disabled={status === "submitting"}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
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

        <Field
          label="Description"
          htmlFor="description"
          required
          error={errors.description}
          hint="Describe the venture and its purpose."
        >
          <Textarea
            id="description"
            rows={4}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            disabled={status === "submitting"}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Image IDs (comma-separated)"
            htmlFor="imageIds"
            hint="Comma-separated image identifiers or URLs."
          >
            <Input
              id="imageIds"
              value={values.imageIds}
              onChange={(e) => update("imageIds", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Website URL" htmlFor="websiteUrl">
            <Input
              id="websiteUrl"
              type="url"
              value={values.websiteUrl}
              onChange={(e) => update("websiteUrl", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="featured"
            type="checkbox"
            checked={values.featured}
            onChange={(e) => update("featured", e.target.checked)}
            disabled={status === "submitting"}
            className="mt-1 h-4 w-4 shrink-0 accent-accent"
          />
          <label htmlFor="featured" className="text-body-sm text-muted">
            Featured venture
          </label>
        </div>

        <div className="flex items-start gap-3">
          <input
            id="published"
            type="checkbox"
            checked={values.published}
            onChange={(e) => update("published", e.target.checked)}
            disabled={status === "submitting"}
            className="mt-1 h-4 w-4 shrink-0 accent-accent"
          />
          <label htmlFor="published" className="text-body-sm text-muted">
            Publish on public website
            {values.published ? " — visible to visitors" : " — draft only"}
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.replace("/admin/digital-ventures")}
            disabled={status === "submitting"}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={status === "submitting"} className="w-full sm:w-auto">
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create Venture"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

