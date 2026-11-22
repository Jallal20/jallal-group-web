import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Mail } from "lucide-react";
import { requireAdmin, hasPermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PaymentVerifyForm } from "@/components/admin/payment-verify-form";
import {
  BackendNotConfiguredError,
  getCoursePayment,
} from "@/lib/course-payments";
import { getCourseApplication } from "@/lib/course-applications";
import { formatDate } from "@/lib/utils-date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Verify Payment" };
export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function PaymentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  await requireAdmin();

  const { id } = await params;
  const payment = await getCoursePayment(id);
  if (!payment) {
    notFound();
  }

  const application = await getCourseApplication(payment.applicationId).catch(() => null);

  const receiptUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1"}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${payment.receiptFileId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/jallal-institute/payments"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to payments
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Payment verification
        </h1>
        <p className="text-body-md text-muted">{payment.studentEmail}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-title-md font-semibold text-ink">
                {payment.studentEmail}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-xs font-medium border",
                  payment.status === "verified"
                    ? "bg-success/10 text-success border border-success/20"
                    : payment.status === "rejected"
                      ? "bg-danger/10 text-danger border border-danger/20"
                      : "bg-warning/10 text-warning border border-warning/20",
                )}
              >
                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </span>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-body-sm">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Course</dt>
                <dd className="font-semibold text-ink">{payment.courseName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Application</dt>
                <dd className="text-ink font-mono text-xs">
                  {payment.applicationId}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Transaction reference</dt>
                <dd className="text-ink font-mono text-xs">
                  {payment.transactionReference}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Amount submitted</dt>
                <dd className="text-ink font-semibold">
                  {formatCurrency(payment.amount, payment.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Payment method</dt>
                <dd className="text-ink">{payment.paymentMethod}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Payment date</dt>
                <dd className="text-ink">{formatDate(payment.paymentDate)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Submitted</dt>
                <dd className="text-ink">{formatDate(payment.createdAt)}</dd>
              </div>
            </dl>

            {payment.receiptFileId && (
              <div className="mt-6">
                <h3 className="label-caps text-muted mb-3">Payment receipt</h3>
                <div className="flex items-center gap-3">
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 label-caps text-ink transition-colors hover:bg-sunken"
                  >
                    <FileText className="h-4 w-4" />
                    View receipt {payment.receiptFileName}
                  </a>
                </div>
              </div>
            )}

            {payment.status === "rejected" && payment.rejectionReason && (
              <div className="mt-6 rounded-md border border-danger/30 bg-danger/5 p-4">
                <h3 className="label-caps text-danger mb-2">Rejection reason</h3>
                <p className="text-body-sm text-danger">
                  {payment.rejectionReason}
                </p>
              </div>
            )}
          </section>

          {application && (
            <section className="rounded-lg border border-line bg-white p-6 shadow-card mt-6">
              <h3 className="label-caps text-muted mb-3">Related application</h3>
              <dl className="grid grid-cols-1 gap-3 text-body-sm">
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Applicant</dt>
                  <dd className="text-ink font-semibold">{application.fullName}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Email</dt>
                  <dd className="text-ink">{application.email}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Application status</dt>
                  <dd className="text-ink">
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace("-", " ")}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/admin/jallal-institute/course-applications/${application.id}`}
                className="inline-flex items-center gap-2 label-caps text-accent hover:underline"
              >
                Open application <Mail className="h-4 w-4 ml-1" />
              </Link>
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-4">
          {payment.status === "submitted" ? (
            <PaymentVerifyForm payment={payment} />
          ) : (
            <section className="rounded-lg border border-line bg-white p-6 shadow-card">
              <h3 className="label-caps text-accent mb-4">Verification record</h3>
              <dl className="grid grid-cols-1 gap-3 text-body-sm">
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Outcome</dt>
                  <dd className="text-ink font-semibold">
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </dd>
                </div>
                {payment.verifiedBy && (
                  <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                    <dt className="text-muted">Verified by</dt>
                    <dd className="text-ink">{payment.verifiedByEmail}</dd>
                  </div>
                )}
                {payment.verifiedAt && (
                  <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                    <dt className="text-muted">Verified at</dt>
                    <dd className="text-ink">{formatDate(payment.verifiedAt)}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency,
  }).format(value);
}

