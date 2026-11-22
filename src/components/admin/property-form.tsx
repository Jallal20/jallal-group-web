"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

type PropertyFormValues = {
  title: string;
  slug: string;
  category: string;
  propertyType: string;
  description: string;
  location: string;
  district: string;
  community: string;
  price: string;
  currency: string;
  size: string;
  status: string;
  imageIds: string;
  videoUrl: string;
  featured: boolean;
  projectDesignation: string;
  contactInfo: string;
  published: boolean;
};

const CATEGORIES: string[] = [
  "lands-for-sale",
  "residential-properties",
  "houses-for-sale",
  "houses-for-rent",
  "commercial-properties",
  "real-estate-development-projects",
  "upcoming-major-projects",
];
const STATUSES: string[] = ["available", "sold", "rented", "off-market"];

interface EditPropertyFormProps {
  property: {
    id: string;
    title: string;
    slug: string;
    category: string;
    propertyType: string;
    description: string;
    location: string;
    district: string;
    community: string;
    price: number;
    currency: string;
    size: string;
    status: string;
    imageIds: string[];
    videoUrl: string;
    featured: boolean;
    projectDesignation: string;
    contactInfo: string;
    published: boolean;
  };
}

export function EditPropertyForm({ property }: EditPropertyFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<PropertyFormValues>({
    title: property.title,
    slug: property.slug,
    category: property.category,
    propertyType: property.propertyType,
    description: property.description,
    location: property.location,
    district: property.district,
    community: property.community,
    price: String(property.price),
    currency: property.currency,
    size: property.size,
    status: property.status,
    imageIds: property.imageIds.join(", "),
    videoUrl: property.videoUrl,
    featured: property.featured,
    projectDesignation: property.projectDesignation,
    contactInfo: property.contactInfo,
    published: property.published,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.replace("/admin/jallal-properties/properties");
        router.refresh();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  function update(field: keyof PropertyFormValues, value: unknown) {
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
    if (!values.title.trim()) nextErrors.title = "Title is required.";
    if (!values.slug.trim()) nextErrors.slug = "Slug is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setServerError(null);

    try {
      const response = await fetch(`/api/admin/properties/${property.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          price: parseInt(values.price || "0", 10) || 0,
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
        setStatus("success");
        return;
      }

      setServerError(payload.message ?? "Failed to update property.");
      setStatus("idle");
    } catch {
      setServerError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Permanently delete "${property.title}"? This cannot be undone.`,
      )
    )
      return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/properties/${property.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.replace("/admin/jallal-properties/properties");
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
              Property updated
            </h3>
            <p className="text-body-md leading-relaxed text-muted">
              Changes have been saved successfully.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Property Title" htmlFor="title" required error={errors.title}>
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

            <Field label="Category" htmlFor="category" required>
              <Select
                id="category"
                value={values.category}
                onChange={(e) => update("category", e.target.value)}
                disabled={status === "submitting"}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c
                      .split("-")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")
                  }
                </option>
                ))}
              </Select>
            </Field>

            <Field label="Property Type" htmlFor="propertyType" required>
              <Input
                id="propertyType"
                value={values.propertyType}
                onChange={(e) => update("propertyType", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>
          </div>

          <Field
            label="Description"
            htmlFor="description"
            required
            hint="Describe the property, its features and selling points."
          >
            <Textarea
              id="description"
              rows={4}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label="Location" htmlFor="location" required>
              <Input
                id="location"
                value={values.location}
                onChange={(e) => update("location", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="District" htmlFor="district">
              <Input
                id="district"
                value={values.district}
                onChange={(e) => update("district", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Community" htmlFor="community">
              <Input
                id="community"
                value={values.community}
                onChange={(e) => update("community", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label="Price" htmlFor="price">
              <Input
                id="price"
                type="number"
                value={values.price}
                onChange={(e) => update("price", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Currency" htmlFor="currency">
              <Select
                id="currency"
                value={values.currency}
                onChange={(e) => update("currency", e.target.value)}
                disabled={status === "submitting"}
              >
                <option value="SLE">Sierra Leonean Leone (SLE)</option>
                <option value="USD">US Dollar (USD)</option>
              </Select>
            </Field>

            <Field label="Size / Dimensions" htmlFor="size">
              <Input
                id="size"
                value={values.size}
                onChange={(e) => update("size", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>
          </div>

          <Field label="Status" htmlFor="status" required>
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Image IDs (comma-separated)" htmlFor="imageIds" hint="Comma-separated image identifiers or URLs.">
              <Input
                id="imageIds"
                value={values.imageIds}
                onChange={(e) => update("imageIds", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Video URL" htmlFor="videoUrl">
              <Input
                id="videoUrl"
                type="url"
                value={values.videoUrl}
                onChange={(e) => update("videoUrl", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>
          </div>

          <Field
            label="Project Designation"
            htmlFor="projectDesignation"
            hint="If part of a major development project, name it here."
          >
            <Input
              id="projectDesignation"
              value={values.projectDesignation}
              onChange={(e) => update("projectDesignation", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field
            label="Contact Information"
            htmlFor="contactInfo"
            hint="Phone, email or office contact for inquiries."
          >
            <Input
              id="contactInfo"
              value={values.contactInfo}
              onChange={(e) => update("contactInfo", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

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
              Publish on public website{" "}
              {values.published ? "— visible to visitors" : "— draft only"}
            </label>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-6 border-t border-line">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.replace("/admin/jallal-properties/properties")}
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
            {deleting ? "Deleting…" : "Delete Property"}
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
