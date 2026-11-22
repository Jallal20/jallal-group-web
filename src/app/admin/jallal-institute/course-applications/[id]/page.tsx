import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { requireAdmin, hasPermission } from "@/lib/auth";
import { ApplicationReviewActions } from "@/components/admin/application-review-actions";
import { getCourseApplication } from "@/lib/course-applications";
import { listStatusHistory } from "@/lib/application-status-history";
import { formatDate } from "@/lib/utils-date";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Review Application" };
export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function ApplicationReviewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  await requireAdmin();

  const { id } = await params;
  const application = await getCourseApplication(id);
  if (!application) {
    notFound();
  }

  const history = await listStatusHistory(id).catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/jallal-institute/course-applications"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to enrollments
        </Link>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Application {application.reference}
        </h1>
        <p className="text-body-md text-muted">{application.courseName}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-title-md font-semibold text-ink">
                {application.fullName}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-xs font-medium border",
                  application.status === "enrollment-confirmed"
                    ? "bg-success/10 text-success border border-success/20"
                    : application.status === "approved" ||
                      application.status === "payment-verified"
                      ? "bg-accent/10 text-ink border border-accent/20"
                      : application.status === "pending-review"
                        ? "bg-muted/10 text-muted border border-line"
                        : application.status === "rejected"
                          ? "bg-danger/10 text-danger border border-danger/20"
                          : "bg-warning/10 text-warning border border-warning/20",
                )}
              >
                {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace("-", " ")}
              </span>
              {application.paymentStatus !== "none" && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-xs font-medium bg-sunken text-muted border border-white/30"
                >
                  Payment:{application.paymentStatus.charAt(0).toUpperCase() + application.paymentStatus.slice(1)}
                </span>
              )}
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-body-sm">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Course</dt>
                <dd className="font-semibold text-ink">{application.courseName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Reference</dt>
                <dd className="font-mono text-xs font-semibold text-ink">
                  {application.reference}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Email</dt>
                <dd className="text-ink">
                  <a
                    href={`mailto:${application.email}`}
                    className="underline underline-offset-2 hover:text-accent"
                  >
                    {application.email}
                  </a>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Phone</dt>
                <dd className="text-ink">
                  <a
                    href={`tel:${application.phone.replace(/[^\d+]/g, "")}`}
                    className="underline underline-offset-2 hover:text-accent"
                  >
                    {application.phone}
                  </a>
                </dd>
              </div>
              {application.whatsappNumber && (
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">WhatsApp</dt>
                  <dd className="text-ink">{application.whatsappNumber}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Submitted</dt>
                <dd className="text-ink">{formatDate(application.createdAt)}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <h3 className="label-caps text-muted mb-3">Applicant details</h3>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-body-sm">
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Country</dt>
                  <dd className="text-ink">{application.country || "Not provided"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">District</dt>
                  <dd className="text-ink">{application.district || "Not provided"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Date of birth</dt>
                  <dd className="text-ink">
                    {formatDate(application.dateOfBirth)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Gender</dt>
                  <dd className="text-ink">{application.gender || "Not specified"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Highest qualification</dt>
                  <dd className="text-ink">
                    {application.highestQualification || "Not provided"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Institution</dt>
                  <dd className="text-ink">
                    {application.institution || "Not provided"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Occupation</dt>
                  <dd className="text-ink">{application.occupation || "Not provided"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Delivery preference</dt>
                  <dd className="text-ink">
                    {application.deliveryPreference || "Not specified"}
                  </dd>
                </div>
              </dl>
            </div>

            {application.whyJoin && (
              <div className="mt-6">
                <h3 className="label-caps text-muted mb-3">Motivation</h3>
                <p className="text-body-sm leading-relaxed text-ink/85 whitespace-pre-line">
                  {application.whyJoin}
                </p>
              </div>
            )}
            {application.relevantExperience && (
              <div className="mt-6">
                <h3 className="label-caps text-muted mb-3">Relevant experience</h3>
                <p className="text-body-sm leading-relaxed text-ink/85 whitespace-pre-line">
                  {application.relevantExperience}
                </p>
              </div>
            )}
            {application.additionalInformation && (
              <div className="mt-6">
                <h3 className="label-caps text-muted mb-3">Additional information</h3>
                <p className="text-body-sm leading-relaxed text-ink/85 whitespace-pre-line">
                  {application.additionalInformation}
                </p>
              </div>
            )}
          </section>

          <ApplicationReviewActions application={application} />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-4">
          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <span className="label-caps text-muted">Contact applicant</span>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={`mailto:${application.email}?subject=Jallal Institute — Application ${application.reference}`}
                className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 label-caps text-ink transition-colors hover:bg-sunken"
              >
                <Mail className="h-4 w-4" />
                Email {application.email}
              </a>
              <a
                href={`tel:${application.phone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 label-caps text-ink transition-colors hover:bg-sunken"
              >
                <Phone className="h-4 w-4" />
                Call {application.phone}
              </a>
            </div>
          </section>

          {history.length > 0 && (
            <section className="rounded-lg border border-line bg-white p-6 shadow-card mt-4">
              <span className="label-caps text-muted mb-3 block">Status history</span>
              <div className="space-y-3">
                {history.map((entry) => (
                  <div key={entry.id} className="text-body-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-ink">{entry.changedByEmail}</span>
                      <span className="text-label-xs text-muted">{formatDate(entry.changedAt)}</span>
                    </div>
                    <p className="text-body-sm text-muted">
                      {entry.status.charAt(0).toUpperCase() + entry.status.slice(1).replace("-", " ")}
                    </p>
                    {entry.notes && (
                      <p className="text-xs text-muted/70">{entry.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

