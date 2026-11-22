"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function InquiryDeleteButton({
  id,
  label,
  className,
}: {
  id: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Permanently delete this inquiry? This cannot be undone.",
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: "DELETE",
      });
      const payload: { message?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setError(payload.message ?? "Delete failed. Please try again.");
        setBusy(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Delete failed.");
      setBusy(false);
    }
  }

  if (error) {
    return (
      <span className="inline-flex items-center gap-2 text-body-sm text-danger">
        {error}
        <button
          type="button"
          onClick={() => setError(null)}
          className="underline underline-offset-2"
        >
          Dismiss
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-md border border-danger/30 bg-white px-3 py-2 label-caps text-danger transition-colors hover:bg-danger hover:text-white disabled:opacity-60 ${className ?? ""}`}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {busy ? "Deleting…" : label ?? "Delete"}
    </button>
  );
}
