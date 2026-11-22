import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Settings, ShieldCheck, Globe, Palette } from "lucide-react";

export const metadata: Metadata = { title: "General Settings" };
export const dynamic = "force-dynamic";

export default function GeneralSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Settings</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          General Settings
        </h1>
        <p className="text-body-md text-muted">
          Configure company information, branding and contact details.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-5 w-5 text-accent" />
          <h2 className="text-headline-sm font-semibold text-ink">Company Information</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="label-caps text-muted">Company Name</label>
            <input
              type="text"
              defaultValue="Jallal Group"
              className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-caps text-muted">Legal Name</label>
            <input
              type="text"
              defaultValue="Jallal Group"
              className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-caps text-muted">Tagline</label>
            <input
              type="text"
              defaultValue=""
              className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-caps text-muted">Location</label>
            <input
              type="text"
              defaultValue="Bo, Sierra Leone"
              className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-caps text-muted">Email</label>
            <input
              type="email"
              defaultValue="partnerships@jallalgroup.com"
              className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-caps text-muted">Official Contact Numbers</label>
            <input
              type="text"
              defaultValue="+232 31 435 238, +232 72 025 505, +232 72 264 297, +232 80 360 996"
              className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
            <p className="mt-1 text-[11px] text-muted">
              Official Jallal Group contact numbers. All four are displayable and
              clickable (tel:) across the website footer.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-caps text-muted">Founded</label>
            <input
              type="text"
              defaultValue="2021"
              className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-card mt-4">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="h-5 w-5 text-accent" />
          <h2 className="text-headline-sm font-semibold text-ink">Social Media Links</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="label-caps text-muted">LinkedIn</label>
            <input
              type="url"
              defaultValue="https://www.linkedin.com/company/jallal-group"
              className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-caps text-muted">X (Twitter)</label>
            <input
              type="url"
              defaultValue="https://x.com/jallalgroup"
              className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
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
