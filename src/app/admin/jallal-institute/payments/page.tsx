import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Search } from "lucide-react";
import { requireAdmin, hasPermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { BackendNotConfiguredError, listCoursePayments } from "@/lib/course-payments";
import { getCourse } from "@/lib/courses";
import type { PaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment Verification" };
export const dynamic = "force-dynamic";

const STATUSES: PaymentStatus[] = ["submitted", "verified", "rejected"];

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; course?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = STATUSES.includes(params.status as PaymentStatus)
    ? (params.status as PaymentStatus)
    : undefined;
  const course = (params.course ?? "").trim() || undefined;

  let items: Awaited<ReturnType<typeof listCoursePayments>>["items"] = [];
  let total = 0;
  let error: string | null = null;
  let courses: Awaited<ReturnType<typeof getCourse>>[] = [];

  try {
    const [result] = await Promise.all([
      listCoursePayments({ search: q, status, courseId: course, limit: 100 }),
    ]);
    items = result.items;
    total = result.total;

    const courseIds = [...new Set(items.map((i) => i.courseId))];
    courses = await Promise.all(courseIds.map((id) => getCourse(id)));
  } catch (caught) {
    error =
      caught instanceof BackendNotConfiguredError
        ? "The Appwrite backend is not configured for this deployment."
        : "Payments could not be loaded right now.";
  }

  const courseMap = Object.fromEntries(
    courses.filter(Boolean).map((c) => [c!.id, c!]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Jallal Institute of Technology</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Payment Verification
        </h1>
        <p className="text-body-md text-muted">
          Review uploaded payment evidence and confirm or reject payments.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-5 text-body-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder="Search by email, transaction reference or course…"
            className="w-full md:w-96"
          />
        </div>

        <div className="flex w-full flex-col gap-2 md:w-96 md:flex-row md:items-end">
          <Select className="w-full md:w-48">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
          <Select className="w-full md:w-56">
            <option value="">All courses</option>
            {Object.values(courseMap).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </div>
      </div>

      {!error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
            <Search className="h-6 w-6" />
          </span>
          <p className="text-body-md text-ink">No payment records match.</p>
          <p className="max-w-md text-body-sm text-muted">
            {q || status || course
              ? "Try clearing the search or filters."
              : "Payment evidence submitted by students will appear here."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white shadow-card overflow-hidden">
          {items.map((payment) => {
            const course = courseMap[payment.courseId];
            return (
              <li
                key={payment.id}
                className="flex flex-col gap-4 px-6 py-5 transition-colors hover:bg-surface lg:flex-row lg:items-start lg:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/jallal-institute/payments/${payment.id}`}
                      className="text-title-md font-semibold text-ink underline-offset-4 transition-colors hover:text-accent hover:underline"
                    >
                      {payment.studentEmail}
                    </Link>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-medium",
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
                  <p className="text-body-sm text-muted">
                    <span className="font-semibold text-ink">
                      {course?.name || payment.courseName}
                    </span>{" "}
                    · Reference:{" "}
                    <span className="font-mono text-xs">
                      {payment.transactionReference}
                    </span>
                  </p>
                  <p className="text-label-sm text-muted">
                    {formatCurrency(payment.amount, payment.currency)} ·{" "}
                    {payment.paymentMethod} · {formatDate(payment.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/jallal-institute/payments/${payment.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 label-caps text-ink transition-colors hover:border-ink"
                  >
                    Verify
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between border-t border-line px-6 py-3 text-label-sm text-muted">
          <span>{total} payment record{total === 1 ? "" : "s"} shown</span>
        </div>
      )}
    </div>
  );
}

