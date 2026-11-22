import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, Phone } from "lucide-react";
import { InquiryDeleteButton } from "@/components/admin/inquiry-delete-button";
import { InquiryStatusForm } from "@/components/admin/inquiry-status-form";
import { InquiryStatusPill } from "@/components/admin/inquiry-status-pill";
import { requireAdmin } from "@/lib/auth";
import { getInquiry } from "@/lib/inquiries";

export const metadata: Metadata = { title: "Inquiry detail" };
export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();

  const mailtoHref = `mailto:${inquiry.email}?subject=${encodeURIComponent(
    `Jallal Group — your partnership inquiry (${inquiry.partnershipType})`,
  )}`;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/inquiries"
        className="inline-flex w-fit items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All inquiries
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-headline-lg font-bold tracking-tight text-ink">
              {inquiry.fullName}
            </h1>
            <InquiryStatusPill status={inquiry.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-body-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {inquiry.organization}
            </span>
            <a
              href={`mailto:${inquiry.email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <Mail className="h-4 w-4" />
              {inquiry.email}
            </a>
            {inquiry.phone ? (
              <a
                href={`tel:${inquiry.phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
              >
                <Phone className="h-4 w-4" />
                {inquiry.phone}
              </a>
            ) : null}
          </div>
          <p className="text-label-sm text-muted">
            Received {formatDate(inquiry.createdAt)} · Last updated{" "}
            {formatDate(inquiry.updatedAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <a
            href={mailtoHref}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-ink px-4 label-caps text-white transition-colors hover:bg-forest"
          >
            <Mail className="h-4 w-4" />
            Reply by email
          </a>
          <InquiryDeleteButton id={inquiry.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-line bg-white p-6 shadow-card lg:col-span-2">
          <span className="label-caps text-accent">
            {inquiry.partnershipType}
          </span>
          <h2 className="mt-2 text-title-md font-semibold text-ink">
            Message
          </h2>
          <div className="mt-3 whitespace-pre-line text-body-md leading-relaxed text-ink/85">
            {inquiry.message}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <InquiryStatusForm id={inquiry.id} status={inquiry.status} />
          </section>

          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <span className="label-caps text-muted">Record</span>
            <dl className="mt-3 flex flex-col gap-2.5 text-body-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Reference</dt>
                <dd className="truncate font-mono text-xs font-semibold text-ink">
                  {inquiry.id}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Type</dt>
                <dd className="font-semibold text-ink">
                  {inquiry.partnershipType}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Created</dt>
                <dd className="font-semibold text-ink">
                  {formatDate(inquiry.createdAt)}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
