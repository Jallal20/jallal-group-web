"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
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

interface EditCourseFormProps {
  course: {
    id: string;
    name: string;
    code: string;
    category: string;
    description: string;
    objectives: string;
    duration: string;
    fee: number;
    currency: string;
    requirements: string;
    imageId: string;
    capacity: number;
    status: string;
    published: boolean;
  };
}

export function EditCourseForm({ course }: EditCourseFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CourseFormValues>({
    name: course.name,
    code: course.code,
    category: course.category,
    description: course.description,
    objectives: course.objectives,
    duration: course.duration,
    fee: String(course.fee),
    currency: course.currency,
    requirements: course.requirements,
    imageId: course.imageId,
    capacity: String(course.capacity),
    status: course.status,
    published: course.published,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.replace("/admin/jallal-institute/courses");
        router.refresh();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

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
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    setServerError(null);

    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
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
        setStatus("success");
        return;
      }

      setServerError(payload.message ?? "Failed to update course.");
      setStatus("idle");
    } catch {
      setServerError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `Permanently delete "${course.name}"? This cannot be undone.`,
      )
    )
      return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.replace("/admin/jallal-institute/courses");
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
              Course updated
            </h3>
            <p className="text-body-md leading-relaxed text-muted">
              Changes have been saved successfully.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Course Name" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>

            <Field label="Course Code" htmlFor="code" required error={errors.code}>
              <Input
                id="code"
                value={values.code}
                onChange={(e) => update("code", e.target.value)}
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
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>

            <Field label="Duration" htmlFor="duration" required>
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

            <Field label="Capacity (seats)" htmlFor="capacity">
              <Input
                id="capacity"
                type="number"
                value={values.capacity}
                onChange={(e) => update("capacity", e.target.value)}
                disabled={status === "submitting"}
              />
            </Field>
          </div>

          <Field
            label="Requirements"
            htmlFor="requirements"
            hint="Prerequisites or entry requirements."
          >
            <Textarea
              id="requirements"
              rows={3}
              value={values.requirements}
              onChange={(e) => update("requirements", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

          <Field label="Image ID" htmlFor="imageId">
            <Input
              id="imageId"
              value={values.imageId}
              onChange={(e) => update("imageId", e.target.value)}
              disabled={status === "submitting"}
            />
          </Field>

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
            onClick={() => router.replace("/admin/jallal-institute/courses")}
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
            {deleting ? "Deleting…" : "Delete Course"}
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
