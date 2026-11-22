import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";
import { InquiryDeleteButton } from "@/components/admin/inquiry-delete-button";
import { InquiryFilters } from "@/components/admin/inquiry-filters";
import { InquiryStatusPill } from "@/components/admin/inquiry-status-pill";
import { requireAdmin } from "@/lib/auth";
import { BackendNotConfiguredError, listInquiries } from "@/lib/inquiries";
import type { InquiryStatus } from "@/lib/types";
import { partnershipTypeOptions } from "@/content/ventures";

export const metadata: Metadata = { title: "Inquiries" };
export const dynamic = "force-dynamic";

type Search = { q?: string; status?: string; type?: string };

const STATUSES: InquiryStatus[] = ["pending", "reviewed", "responded"];

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = STATUSES.includes(params.status as InquiryStatus)
    ? (params.status as InquiryStatus)
    : undefined;
  const type = params.type && params.type !== "all" ? params.type : undefined;

  let items: Awaited<ReturnType<typeof listInquiries>>["items"] = [];
  let total = 0;
  let error: string | null = null;

  try {
    const result = await listInquiries({
      status: status ?? "all",
      partnershipType: type,
      search: query,
      limit: 200,
    });
    items = result.items;
    total = result.total;
  } catch (caught) {
    error =
      caught instanceof BackendNotConfiguredError
        ? "The Appwrite backend is not configured for this deployment, so stored inquiries cannot be loaded."
        : "Inquiries could not be loaded right now. Please try again.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Administration</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Partnership inquiries
        </h1>
        <p className="text-body-md text-muted">
          Every submission from the public inquiry form, newest first.
        </p>
      </div>

      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
        <InquiryFilters
          statusOptions={[
            { value: "all", label: "All statuses" },
            ...STATUSES.map((value) => ({
              value,
              label: value.charAt(0).toUpperCase() + value.slice(1),
            })),
          ]}
          typeOptions={[
            { value: "all", label: "All partnership types" },
            ...partnershipTypeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            })),
          ]}
        />

        {error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-body-md text-danger">{error}</p>
            <p className="mt-2 text-body-sm text-muted">
              Configure Appwrite (see <code className="font-mono">.env.example</code>)
              and provision tables with{" "}
              <code className="font-mono">node scripts/appwrite-setup.mjs</code>.
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-surface text-muted">
              <Inbox className="h-5 w-5" />
            </span>
            <p className="text-body-md text-ink">No inquiries match.</p>
            <p className="max-w-md text-body-sm text-muted">
              {query || status || type
                ? "Try clearing the search or filters."
                : "Submissions to the partnership form will appear here automatically."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((inquiry) => (
              <li
                key={inquiry.id}
                className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-surface lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/admin/inquiries/${inquiry.id}`}
                      className="text-title-md font-semibold text-ink underline-offset-4 transition-colors hover:text-accent hover:underline"
                    >
                      {inquiry.fullName}
                    </Link>
                    <InquiryStatusPill status={inquiry.status} />
                  </div>
                  <p className="text-body-sm text-muted">
                    {inquiry.organization} · {inquiry.email}
                    {inquiry.phone ? ` · ${inquiry.phone}` : ""}
                  </p>
                  <p className="max-w-3xl text-body-sm leading-relaxed text-ink/80">
                    <span className="label-caps mr-2 text-muted">
                      {inquiry.partnershipType}
                    </span>
                    {inquiry.message.length > 220
                      ? `${inquiry.message.slice(0, 220)}…`
                      : inquiry.message}
                  </p>
                  <p className="text-label-sm text-muted">
                    {formatDate(inquiry.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/inquiries/${inquiry.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 label-caps text-ink transition-colors hover:border-ink"
                  >
                    Open
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <InquiryDeleteButton id={inquiry.id} />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!error && items.length > 0 ? (
          <div className="flex items-center justify-between border-t border-line px-6 py-3 text-label-sm text-muted">
            <span>
              {total} inquiry{total === 1 ? "" : "ies"} shown
            </span>
            <span>Maximum 200 per view</span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
