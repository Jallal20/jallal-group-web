import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ShieldCheck, Lock, Key, User } from "lucide-react";

export const metadata: Metadata = { title: "Security Settings" };
export const dynamic = "force-dynamic";

export default function SecuritySettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Security</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Security Settings
        </h1>
        <p className="text-body-md text-muted">
          Configure administrative security, session policies and access controls.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-5 w-5 text-accent" />
          <h2 className="text-headline-sm font-semibold text-ink">Session Policy</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-md border border-line bg-white">
            <div>
              <span className="label-caps text-muted">Session Lifetime</span>
              <p className="text-body-sm text-ink">12 hours</p>
            </div>
            <span className="text-label-sm text-muted">Admin sessions expire after 12 hours</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-md border border-line bg-white">
            <div>
              <span className="label-caps text-muted">Rate Limiting</span>
              <p className="text-body-sm text-ink">Enabled</p>
            </div>
            <span className="text-label-sm text-muted">Login attempts are rate-limited per IP</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-card mt-4">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="h-5 w-5 text-accent" />
          <h2 className="text-headline-sm font-semibold text-ink">Access Control</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-md border border-line bg-white">
            <div>
              <span className="label-caps text-muted">Super Admin Registration</span>
              <p className="text-body-sm text-ink">Disabled</p>
            </div>
            <span className="text-label-sm text-muted">No public registration; bootstrap only</span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-md border border-line bg-white">
            <div>
              <span className="label-caps text-muted">Role-Based Access</span>
              <p className="text-body-sm text-ink">Enabled</p>
            </div>
            <span className="text-label-sm text-muted">Server-side permission enforcement on all routes</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-card mt-4">
        <div className="flex items-center gap-3 mb-6">
          <Key className="h-5 w-5 text-accent" />
          <h2 className="text-headline-sm font-semibold text-ink">API Credentials</h2>
        </div>
        <div className="rounded-lg border border-line bg-sunken p-4 text-body-sm text-muted">
          <p className="mb-2">Server API keys and secrets are not displayed in the dashboard.</p>
          <p>Manage them through your hosting provider or <code className="font-mono text-xs">.env.local</code>.</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button disabled variant="outline">
          Save Changes
        </Button>
      </div>

      <div className="mt-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          &larr; Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function Button({ children, disabled, variant = "primary" }: { children: React.ReactNode; disabled?: boolean; variant?: "primary" | "outline" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-md font-bold uppercase tracking-[0.1em] text-[11px] leading-4 transition-colors disabled:opacity-60 disabled:pointer-events-none whitespace-nowrap";
  const variants: Record<string, string> = {
    primary: "bg-ink text-white hover:bg-forest",
    outline: "bg-transparent text-ink border border-line hover:border-ink",
  };
  const size = "h-11 px-6";
  return (
    <button className={cn(base, variants[variant], size)} disabled={disabled}>
      {children}
    </button>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

