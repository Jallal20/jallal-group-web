"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

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

export default function NewPropertyPage() {
  const router = useRouter();
  const [values, setValues] = useState<PropertyFormValues>({
    title: "",
    slug: "",
    category: CATEGORIES[0],
    propertyType: "",
    description: "",
    location: "",
    district: "",
    community: "",
    price: "",
    currency: "SLE",
    size: "",
    status: STATUSES[0],
    imageIds: "",
    videoUrl: "",
    featured: false,
    projectDesignation: "",
    contactInfo: "",
    published: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

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
    if (!values.category) nextErrors.category = "Category is required.";
    if (!values.propertyType.trim()) nextErrors.propertyType = "Property type is required.";
    if (!values.description.trim()) nextErrors.description = "Description is required.";
    if (!values.location.trim()) nextErrors.location = "Location is required.";
    if (!values.status) nextErrors.status = "Status is required.";
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setServerError(null);

    try {
      const response = await fetch("/api/admin/properties", {
        method: "POST",
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
        property?: { id: string; slug: string };
      };

      if (response.ok && payload.ok) {
        router.replace(`/admin/jallal-properties/properties`);
        router.refresh();
        return;
      }

      setServerError(payload.message ?? "Failed to create property.");
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
          href="/admin/jallal-properties/properties"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Add New Property
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
          <Field label="Property Title" htmlFor="title" required error={errors.title}>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Slug" htmlFor="slug" required error={errors.slug}
            hint="URL-friendly identifier, e.g. hill-view-villa">
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

          <Field label="Property Type" htmlFor="propertyType" required error={errors.propertyType}
            hint="e.g. House, Land, Office, Apartment">
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
          error={errors.description}
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
          <Field label="Location" htmlFor="location" required error={errors.location}>
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
          label="Project Designation" htmlFor="projectDesignation"
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
          label="Contact Information" htmlFor="contactInfo"
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
            Publish on public website
            {values.published ? " — visible to visitors" : " — draft only"}
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.replace("/admin/jallal-properties/properties")}
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
              "Create Property"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
