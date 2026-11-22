"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Network failures should not trap the user in a stale session.
    }
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 label-caps text-ink transition-colors hover:border-ink disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
