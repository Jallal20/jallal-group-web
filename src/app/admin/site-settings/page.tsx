import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listSiteSettings, updateSiteSetting } from "@/lib/site-settings";
import React from "react";

export const metadata: Metadata = { title: "Site Settings" };
export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  await requireAdmin();

  let items: Awaited<ReturnType<typeof listSiteSettings>>["items"] = [];
  let error: string | null = null;

  try {
    const result = await listSiteSettings({ limit: 100 });
    items = result.items;
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : "Site settings could not be loaded right now.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">CMS</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Site Settings
        </h1>
        <p className="text-body-md text-muted">
          Manage website content and branding without editing source code.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-5 text-body-sm text-danger">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-line bg-white p-6 shadow-card">
        <h2 className="text-headline-sm font-semibold text-ink mb-4">Website Settings</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((setting) => (
            <SettingRow key={setting.id} setting={setting} />
          ))}
          {items.length === 0 && (
            <p className="text-body-sm text-muted">
              No site settings configured. Add your first setting via the API or
              database.
            </p>
          )}
        </div>
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

function SettingRow({ setting }: { setting: { id: string; key: string; value: string; updatedAt: string } }) {
  const [value, setValue] = React.useState(setting.value);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateSiteSetting(setting.key, value, { id: "current", email: "current" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error handled by API response
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="label-caps text-muted">{setting.key}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={handleSave}
          className="w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
        {saving ? (
          <span className="text-[10px] text-accent animate-pulse">Saving…</span>
        ) : saved ? (
          <span className="text-[10px] text-forest">Saved</span>
        ) : null}
      </div>
      <p className="text-label-xs text-muted">
        Updated {new Date(setting.updatedAt).toLocaleDateString("en-GB")}
      </p>
    </div>
  );
}
