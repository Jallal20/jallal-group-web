"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Search,
  ExternalLink,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";

type Company = {
  id: string;
  slug: string;
  name: string;
  order: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CompaniesPage() {
  const [items, setItems] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      params.set("limit", "200");
      const res = await fetch(`/api/admin/companies?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Failed to load companies.");
      const data = await res.json();
      setItems(data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Companies could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const name = form.get("name") as string;
    const slug = form.get("slug") as string;
    const order = form.get("order") as string;
    const description = form.get("description") as string;
    const industry = form.get("industry") as string;
    const website = form.get("website") as string;
    const email = form.get("email") as string;
    const phone = form.get("phone") as string;
    const address = form.get("address") as string;
    const logoUrl = form.get("logoUrl") as string;
    const published = form.get("published") === "on";

    const payload = {
      description,
      industry,
      website,
      email,
      phone,
      address,
      logoUrl,
      socialLinks: {
        facebook: form.get("socialFacebook") as string,
        twitter: form.get("socialTwitter") as string,
        instagram: form.get("socialInstagram") as string,
        linkedin: form.get("socialLinkedIn") as string,
        youtube: form.get("socialYoutube") as string,
      },
      contactDetails: {
        email,
        phone,
        address,
        website,
      },
      published,
    };

    setSaving(true);
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `/api/admin/companies?id=${editing.id}`
        : "/api/admin/companies";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          order: order ? parseInt(order, 10) : 0,
          payload,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to save company.");
      }
      setEditing(null);
      setOpen(false);
      (e.currentTarget as HTMLFormElement).reset();
      await fetchCompanies();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save company.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete company "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/companies?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete company.");
      await fetchCompanies();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete company.");
    } finally {
      setDeletingId(null);
    }
  };

  const statusColor = (published: boolean) =>
    published
      ? "bg-success/10 text-success border border-success/20"
      : "bg-danger/10 text-danger border border-danger/20";
  const statusText = (published: boolean) => (published ? "Published" : "Unpublished");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Company Management</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Companies
          </h1>
          <p className="text-body-md text-muted">
            Manage Jallal Group's four portfolio companies. Changes are
            reflected on the public company pages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="accent" size="sm" disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[620px]">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Company" : "Add Company"}</DialogTitle>
                <DialogDescription>
                  Enter company details. Logo and images can be selected from
                  the Media Library.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Company name</Label>
                    <Input
                      id="name"
                      ref={nameRef}
                      defaultValue={editing?.name ?? ""}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      defaultValue={editing?.slug ?? ""}
                      required
                      placeholder="jallal-tech"
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      defaultValue={
                        (editing?.payload.description as string) ?? ""
                      }
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      defaultValue={
                        (editing?.payload.industry as string) ?? ""
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="order">Display order</Label>
                    <Input
                      id="order"
                      type="number"
                      defaultValue={editing?.order?.toString() ?? "0"}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <Input
                      id="logoUrl"
                      type="url"
                      defaultValue={
                        (editing?.payload.logoUrl as string) ?? ""
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      defaultValue={
                        (editing?.payload.website as string) ?? ""
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Contact email</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={
                        (editing?.payload.email as string) ?? ""
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="phone">Contact phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      defaultValue={
                        (editing?.payload.phone as string) ?? ""
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      defaultValue={
                        (editing?.payload.address as string) ?? ""
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label className="flex items-center gap-2">
                      <Checkbox
                        id="published"
                        defaultChecked={Boolean(editing?.payload.published)}
                      />
                      Publish company publicly
                    </Label>
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label className="text-label-sm text-muted mb-1">
                      Social media links
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        id="socialFacebook"
                        placeholder="Facebook"
                        defaultValue={
                          ((editing?.payload.socialLinks as any)?.facebook ??
                            "") as string
                        }
                      />
                      <Input
                        id="socialTwitter"
                        placeholder="Twitter/X"
                        defaultValue={
                          ((editing?.payload.socialLinks as any)?.twitter ??
                            "") as string
                        }
                      />
                      <Input
                        id="socialInstagram"
                        placeholder="Instagram"
                        defaultValue={
                          ((editing?.payload.socialLinks as any)?.instagram ??
                            "") as string
                        }
                      />
                      <Input
                        id="socialLinkedIn"
                        placeholder="LinkedIn"
                        defaultValue={
                          ((editing?.payload.socialLinks as any)?.linkedin ??
                            "") as string
                        }
                      />
                      <Input
                        id="socialYoutube"
                        placeholder="YouTube"
                        defaultValue={
                          ((editing?.payload.socialLinks as any)?.youtube ??
                            "") as string
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : editing ? "Update company" : "Create company"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearch("")}
            disabled={loading || !search}
          >
            <Search className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-5 text-body-sm text-danger">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-line bg-white shadow-card overflow-hidden">
        <div className="border-b border-line px-6 py-3 flex items-center gap-3">
          <Search className="h-4 w-4 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies by name, slug, industry…"
            className="flex-1 bg-transparent border-0 outline-none text-body-sm"
          />
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-body-sm text-muted">
            Loading companies…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted mx-auto mb-3">
              <Building2Icon className="h-6 w-6" />
            </div>
            <p className="text-body-sm text-ink">No companies found.</p>
            {search ? (
              <p className="mt-2 text-body-sm text-muted">
                Try clearing the search.
              </p>
            ) : (
              <p className="mt-2 text-body-sm text-muted">
                Add your first company to begin managing the group portfolio.
              </p>
            )}
          </div>
        ) : (
          <table className="w-full text-left divide-y divide-line">
            <thead>
              <tr className="bg-surface text-label-sm text-muted uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold text-ink">Company</th>
                <th className="px-6 py-3 font-semibold text-ink">Slug</th>
                <th className="px-6 py-3 font-semibold text-ink">Industry</th>
                <th className="px-6 py-3 font-semibold text-ink">Order</th>
                <th className="px-6 py-3 font-semibold text-ink">Status</th>
                <th className="px-6 py-3 font-semibold text-ink">Updated</th>
                <th className="px-6 py-3 font-semibold text-ink text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((company) => (
                <tr key={company.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-white text-ink">
                        <Building2Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-body-sm font-semibold text-ink">{company.name}</p>
                        <p className="text-label-xs text-muted">{company.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink font-mono">
                    {company.slug}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-muted">
                    {(company.payload.industry as string) || "—"}
                  </td>
                  <td className="px-6 py-4 text-body-sm text-ink">
                    {company.order}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                        statusColor(company.payload.published === true),
                      )}
                    >
                      {statusText(company.payload.published === true)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body-sm text-muted">
                    {formatDate(company.updatedAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/our-companies/${company.slug}`}
                        className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-label-sm text-ink hover:bg-accent hover:text-white transition-colors"
                        title="View public page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(company)}
                        disabled={saving || deletingId !== null}
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(company.id, company.name)}
                        disabled={saving || deletingId !== null}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        <h2 className="text-headline-sm font-semibold text-ink mb-4">
          About company management
        </h2>
        <ul className="space-y-3 text-body-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            Each company has its own dedicated public page at{" "}
            <code className="font-mono text-ink">/our-companies/[slug]</code>.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            Publishing a company makes it visible on the public portfolio.
            Unpublishing hides it without deleting the record.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            Logo and image URLs reference files in the Media Library.
          </li>
        </ul>
      </div>
    </div>
  );
}

function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-headline-sm font-semibold text-ink">{children}</h2>;
}

function Building2Icon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <rect width="13" height="8" x="5.5" y="11" rx="1" ry="1" />
      <rect width="13" height="6" x="5.5" y="2" rx="1" ry="1" />
      <path d="M7.5 11h9" />
      <path d="M7.5 16h9" />
      <line x1="16.5" x2="16.5" y1="2" y2="11" />
    </svg>
  );
}
