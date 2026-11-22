"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";

const STATUSES = ["pending", "under-review", "accepted", "rejected", "enrolled"] as const;

interface EnrollmentDetailFormProps {
  enrollment: {
    id: string;
    reference: string;
    courseId: string;
    courseName: string;
    fullName: string;
    email: string;
    phone: string;
    whatsappNumber: string;
    dateOfBirth: string | null;
    gender: string;
    address: string;
    educationBackground: string;
    relevantExperience: string;
    additionalInformation: string;
    status: string;
    adminNotes: string;
    createdAt: string;
    updatedAt: string;
  };
}

export function EnrollmentDetailForm({ enrollment }: EnrollmentDetailFormProps) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState(enrollment.status);
  const [adminNotes, setAdminNotes] = useState(enrollment.adminNotes);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  async function save() {
    setStatus("saving");
    setServerError(null);

    try {
      const response = await fetch(`/api/admin/enrollments/${enrollment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusValue,
          adminNotes,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (response.ok && payload.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
        router.refresh();
      } else {
        setServerError(payload.message ?? "Failed to update enrollment.");
        setStatus("error");
      }
    } catch {
      setServerError("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="flex flex-col gap-6 lg:col-span-8">
        <section className="rounded-lg border border-line bg-white p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-title-md font-semibold text-ink">
              {enrollment.fullName}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-medium",
                enrollment.status === "accepted"
                  ? "bg-accent/10 text-forest border border-accent/20"
                  : enrollment.status === "pending"
                    ? "bg-warning/10 text-warning border border-warning/20"
                    : enrollment.status === "rejected"
                      ? "bg-danger/10 text-danger border border-danger/20"
                      : "bg-sunken text-muted border border-white/30",
              )}
            >
              {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
            </span>
          </div>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-body-sm">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Course</dt>
              <dd className="font-semibold text-ink">{enrollment.courseName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Reference</dt>
              <dd className="font-mono text-xs font-semibold text-ink">
                {enrollment.reference}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Email</dt>
              <dd className="text-ink">
                <a
                  href={`mailto:${enrollment.email}`}
                  className="underline underline-offset-2 hover:text-accent"
                >
                  {enrollment.email}
                </a>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Phone</dt>
              <dd className="text-ink">
                <a
                  href={`tel:${enrollment.phone.replace(/[^\d+]/g, "")}`}
                  className="underline underline-offset-2 hover:text-accent"
                >
                  {enrollment.phone}
                </a>
              </dd>
            </div>
            {enrollment.whatsappNumber && (
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">WhatsApp</dt>
                <dd className="text-ink">{enrollment.whatsappNumber}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Date of Birth</dt>
              <dd className="text-ink">
                {enrollment.dateOfBirth ? new Date(enrollment.dateOfBirth).toLocaleDateString("en-GB") : "Not provided"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Gender</dt>
              <dd className="text-ink">{enrollment.gender || "Not specified"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Received</dt>
              <dd className="text-ink">
                {new Date(enrollment.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <h3 className="label-caps text-muted mb-2">Education Background</h3>
            <p className="text-body-sm leading-relaxed text-ink/85 whitespace-pre-line">
              {enrollment.educationBackground}
            </p>
          </div>

          {enrollment.relevantExperience && (
            <div className="mt-6">
              <h3 className="label-caps text-muted mb-2">Relevant Experience</h3>
              <p className="text-body-sm leading-relaxed text-ink/85 whitespace-pre-line">
                {enrollment.relevantExperience}
              </p>
            </div>
          )}

          {enrollment.additionalInformation && (
            <div className="mt-6">
              <h3 className="label-caps text-muted mb-2">Additional Information</h3>
              <p className="text-body-sm leading-relaxed text-ink/85 whitespace-pre-line">
                {enrollment.additionalInformation}
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-4">
        <section className="rounded-lg border border-line bg-white p-6 shadow-card">
          <h3 className="label-caps text-accent mb-4">Workflow Status</h3>
          <Field
            label="Status"
            htmlFor="status"
            required
          >
            <Select
              id="status"
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              disabled={status === "saving"}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Administrative Notes" htmlFor="adminNotes"
            hint="Internal notes about this enrollment.">
            <Textarea
              id="adminNotes"
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              disabled={status === "saving"}
            />
          </Field>
          <div className="mt-4">
            <Button
              type="button"
              onClick={save}
              disabled={status === "saving"}
              className="w-full"
            >
              {status === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            {status === "saved" && (
              <p className="mt-2 text-xs text-forest font-semibold">
                Changes saved successfully.
              </p>
            )}
          </div>
          {serverError && (
            <div role="alert" className="mt-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-body-sm text-danger">
              {serverError}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-line bg-white p-6 shadow-card mt-4">
          <span className="label-caps text-muted">Contact Student</span>
          <div className="mt-4 flex flex-col gap-3">
            <a
              href={`mailto:${enrollment.email}?subject=Jallal Institute — Enrollment ${enrollment.reference}`}
              className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 label-caps text-ink transition-colors hover:bg-sunken"
            >
              <Mail className="h-4 w-4" />
              Email {enrollment.email}
            </a>
            <a
              href={`tel:${enrollment.phone.replace(/[^\d+]/g, "")}`}
              className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 label-caps text-ink transition-colors hover:bg-sunken"
            >
              <Phone className="h-4 w-4" />
              Call {enrollment.phone}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
