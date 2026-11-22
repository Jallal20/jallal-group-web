"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Save } from "lucide-react";
import type { InquiryStatus } from "@/lib/types";

const STATUSES: InquiryStatus[] = ["pending", "reviewed", "responded"];

export function InquiryStatusForm({
  id,
  status,
}: {
  id: string;
  status: InquiryStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState<InquiryStatus>(status);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function save(next: InquiryStatus) {
    if (next === value) return;
    setState("saving");
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const payload: { ok?: boolean; message?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setValue(status);
        setState("error");
        return;
      }

      setState("saved");
      router.refresh();
    } catch {
      setValue(status);
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="status" className="label-caps text-ink">
        Workflow status
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <select
          id="status"
          value={value}
          onChange={(event) => {
            const next = event.target.value as InquiryStatus;
            setValue(next);
            void save(next);
          }}
          className="h-10 min-w-44 rounded-md border border-line bg-white px-3 text-body-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
        >
          {STATUSES.map((option) => (
            <option key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>

        <span
          aria-live="polite"
          className="inline-flex items-center gap-1.5 text-body-sm"
        >
          {state === "saving" ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin text-muted" />
              <span className="text-muted">Saving…</span>
            </>
          ) : state === "saved" ? (
            <>
              <Save className="h-4 w-4 text-accent" />
              <span className="text-forest">Status updated</span>
            </>
          ) : state === "error" ? (
            <span className="text-danger">Update failed — try again</span>
          ) : (
            <span className="text-muted">Changes save automatically</span>
          )}
        </span>
      </div>
    </div>
  );
}
