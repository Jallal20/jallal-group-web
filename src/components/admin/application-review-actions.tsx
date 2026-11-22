"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";

type ApplicationShape = {
  id: string;
  reference: string;
  courseName: string;
  status: string;
  adminNotes: string;
};

const STATUSES = [
  "pending-review",
  "under-review",
  "approved",
  "rejected",
  "awaiting-payment",
  "payment-submitted",
  "payment-verified",
  "enrollment-confirmed",
] as const;

function statusLabel(status: string) {
  return status
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface ReviewActionsProps {
  application: ApplicationShape;
}

export function ApplicationReviewActions({
  application,
}: ReviewActionsProps) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState(application.status);
  const [adminNotes, setAdminNotes] = useState(application.adminNotes);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  async function save() {
    setStatus("saving");
    setServerError(null);

    try {
      const response = await fetch(`/api/admin/course-applications/${application.id}`, {
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
        setTimeout(() => {
          setStatus("idle");
          router.refresh();
        }, 1500);
      } else {
        setServerError(payload.message ?? "Failed to update application.");
        setStatus("error");
      }
    } catch {
      setServerError("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white p-6 shadow-card">
      <h3 className="label-caps text-accent mb-4">Administrative review</h3>
      {serverError && (
        <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger/5 p-3 text-body-sm text-danger">
          {serverError}
        </div>
      )}
      <Field label="Decision" htmlFor="status" required>
        <Select
          id="status"
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value)}
          disabled={status === "saving"}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </Select>
      </Field>
      <Field
        label="Administrative notes"
        htmlFor="adminNotes"
        hint="Internal notes about this application."
      >
        <Textarea
          id="adminNotes"
          rows={3}
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
            "Save decision"
          )}
        </Button>
        {status === "saved" && (
          <p className="mt-2 text-xs text-forest font-semibold">
            Decision saved and status history recorded.
          </p>
        )}
      </div>
    </section>
  );
}
