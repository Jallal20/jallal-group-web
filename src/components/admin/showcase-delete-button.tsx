"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShowcaseDeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean };
      if (response.ok && payload.ok) {
        router.refresh();
      }
    } catch {
      // noop
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="danger"
      size="sm"
      onClick={handleDelete}
      disabled={pending}
      type="button"
    >
      <Trash2 className="h-3.5 w-3.5 mr-1" />
      Delete
    </Button>
  );
}
