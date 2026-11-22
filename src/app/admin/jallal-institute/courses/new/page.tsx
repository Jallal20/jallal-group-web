"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

const STATUSES = ["available", "full", "closed"] as const;
const CATEGORIES = [
  "Software Development",
  "Data Science",
  "Cybersecurity",
  "Product Design",
  "Digital Marketing",
  "Business Management",
  "Engineering",
] as const;

type CourseFormValues = {
  name: string;
  code: string;
  category: string;
  description: string;
  objectives: string;
  duration: string;
  fee: string;
  currency: string;
  requirements: string;
  imageId: string;
  capacity: string;
  status: string;
  published: boolean;
};

export default function NewCoursePage() {
  const router = useRouter();
  const [values, setValues] = useState<CourseFormValues>({
    name: "",
    code: "",
    category: CATEGORIES[0],
    description: "",
    objectives: "",
    duration: "",
    fee: "",
    currency: "SLE",
    requirements: "",
    imageId: "",
    capacity: "",
    status: STATUSES[0],
    published: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  function update(field: keyof CourseFormValues, value: unknown) {
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
    if (!values.name.trim()) nextErrors.name = "Course name is required.";
    if (!values.code.trim()) nextErrors.code = "Course code is required.";
    if (!values.category) nextErrors.category = "Category is required.";
    if (!values.description.trim()) nextErrors.description = "Description is required.";
    if (!values.duration.trim()) nextErrors.duration = "Duration is required.";
    if (!values.status) nextErrors.status = "Status is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setServerError(null);

    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          fee: parseInt(values.fee || "0", 10) || 0,
          capacity: parseInt(values.capacity || "0", 10) || 0,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (response.ok && payload.ok) {
        router.replace("/admin/jallal-institute/courses");
        router.refresh();
        return;
      }

      setServerError(payload.message ?? "Failed to create course.");
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
          href="/admin/jallal-institute/courses"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Add New Course
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
          <Field label="Course Name" htmlFor="name" required error={errors.name}>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Course Code" htmlFor="code" required error={errors.code}
            hint="e.g. CS101, WD202">
            <Input
              id="code"
              value={values.code}
              onChange={(e) => update("code", e.target.value)}
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

          <Field label="Duration" htmlFor="duration" required error={errors.duration}
            hint="e.g. 12 weeks, 6 months, 3 days">
            <Input
              id="duration"
              value={values.duration}
              onChange={(e) => update("duration", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>
        </div>

        <Field
          label="Description"
          htmlFor="description"
          required
          error={errors.description}
          hint="Describe what this course covers."
        >
          <Textarea
            id="description"
            rows={4}
            value={values.description}
            onChange={(e) => update("description", e.target.value)}
            disabled={status === "submitting"}
          />
        </Field>

        <Field
          label="Course Objectives"
          htmlFor="objectives"
          hint="What will students learn or achieve?"
        >
          <Textarea
            id="objectives"
            rows={3}
            value={values.objectives}
            onChange={(e) => update("objectives", e.target.value)}
            disabled={status === "submitting"}
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Fee" htmlFor="fee">
            <Input
              id="fee"
              type="number"
              value={values.fee}
              onChange={(e) => update("fee", e.target.value)}
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

          <Field label="Capacity (seats)" htmlFor="capacity" hint="0 for open/unlimited.">
            <Input
              id="capacity"
              type="number"
              value={values.capacity}
              onChange={(e) => update("capacity", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>
        </div>

        <Field label="Requirements" htmlFor="requirements"
          hint="Prerequisites or entry requirements.">
          <Textarea
            id="requirements"
            rows={3}
            value={values.requirements}
            onChange={(e) => update("requirements", e.target.value)}
            disabled={status === "submitting"}
          />
        </Field>

        <Field label="Image ID" htmlFor="imageId"
          hint="Image identifier for course listing.">
          <Input
            id="imageId"
            value={values.imageId}
            onChange={(e) => update("imageId", e.target.value)}
            disabled={status === "submitting"}
          />
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
            onClick={() => router.replace("/admin/jallal-institute/courses")}
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
              "Create Course"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
