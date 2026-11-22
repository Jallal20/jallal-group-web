import { notFound } from "next/navigation";
import { getCurrentStudent } from "@/lib/student-auth";
import { redirect } from "next/navigation";
import { getCourseApplication } from "@/lib/course-applications";
import { getCourseBySlug } from "@/lib/courses";
import { getCoursePaymentByApplication } from "@/lib/course-payments";
import Link from "next/link";
import { formatDate } from "@/lib/utils-date";
import { PaymentUploadForm } from "@/components/enrollment/payment-upload-form";
import { Mail, Phone, Clock, FileText, CheckCircle2 } from "lucide-react";

const STAGE_ORDER: { key: string; label: string }[] = [
  { key: "pending-review", label: "Application submitted" },
  { key: "under-review", label: "Application under review" },
  { key: "approved", label: "Application approved" },
  { key: "awaiting-payment", label: "Payment awaiting" },
  { key: "payment-submitted", label: "Payment submitted" },
  { key: "payment-verified", label: "Payment verified" },
  { key: "enrollment-confirmed", label: "Enrolment confirmed" },
];

const STAGE_INDEX: Record<string, number> = Object.fromEntries(
  STAGE_ORDER.map((s, i) => [s.key, i]),
);

export default async function StudentApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const student = await getCurrentStudent();
  if (!student) {
    redirect("/student/login");
  }

  const { id } = await params;
  const application = await getCourseApplication(id);
  if (!application) {
    notFound();
  }

  if (application.studentId && application.studentId !== student.id) {
    notFound();
  }

  const payment = await getCoursePaymentByApplication(id);
  const course = application.courseSlug
    ? await getCourseBySlug(application.courseSlug).catch(() => null)
    : null;
  const paymentStage = STAGE_INDEX[application.status] ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/student/course-applications"
          className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
        >
          <span className="h-4 w-4" /> My applications
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
                  stageColor(application.status),
                )}
              >
                {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace("-", " ")}
              </span>
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
                <dd className="text-ink">
                  {formatDate(application.createdAt)}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <h3 className="label-caps text-accent mb-3">Application progress</h3>
              <div className="flex gap-1 mb-3">
                {STAGE_ORDER.map((stage) => (
                  <div
                    key={stage.key}
                    className={cn(
                      "flex-1 relative h-2 rounded-full overflow-hidden",
                      STAGE_INDEX[stage.key]! < paymentStage
                        ? "bg-success"
                        : STAGE_INDEX[stage.key]! === paymentStage
                          ? "bg-accent"
                          : "bg-line",
                    )}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-muted uppercase tracking-wider">
                {STAGE_ORDER.map((stage) => (
                  <span key={stage.key}>{stage.label}</span>
                ))}
              </div>
            </div>

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
            {application.adminNotes && (
              <div className="mt-6">
                <h3 className="label-caps text-muted mb-3">Administrative notes</h3>
                <p className="text-body-sm leading-relaxed text-ink/85 whitespace-pre-line">
                  {application.adminNotes}
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-4">
          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <h3 className="label-caps text-accent mb-4">Course & fees</h3>
            <dl className="grid grid-cols-1 gap-3 text-body-sm">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Fee</dt>
                <dd className="text-ink font-semibold">
                  {application.courseFee === 0 ? "Free" : new Intl.NumberFormat("en-SL", { style: "currency", currency: application.currency }).format(application.courseFee)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Currency</dt>
                <dd className="text-ink">{application.currency}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Payment status</dt>
                <dd className={cn("text-ink font-semibold", paymentStatusColor(application.paymentStatus))}>
                  {paymentStatusLabel(application.paymentStatus)}
                </dd>
              </div>
            </dl>
          </section>

          {application.status === "awaiting-payment" ||
          application.status === "payment-submitted" ||
          (application.status === "rejected" && application.paymentStatus === "rejected") ? (
            <section className="rounded-lg border border-line bg-white p-6 shadow-card">
              <PaymentUploadForm
                application={application}
                course={course}
                existingPayment={payment}
              />
            </section>
          ) : null}

          {application.status === "enrollment-confirmed" && (
            <section className="rounded-lg border border-success/40 bg-success-soft/20 p-6 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="font-semibold text-success">Enrolment confirmed</span>
              </div>
              <p className="text-body-sm text-success">
                Your enrolment has been confirmed. You can now access your course
                schedule and learning materials.
              </p>
            </section>
          )}

          <section className="rounded-lg border border-line bg-white p-6 shadow-card mt-4">
            <span className="label-caps text-muted">Contact admissions</span>
            <div className="mt-4 flex flex-col gap-3">
              <a
                href={`mailto:${application.email ? "" : "admissions@jallalgroup.local"}&subject=Jallal Institute — Application ${application.reference}`}
                className="flex items-center gap-2 rounded-md border border-line bg-white px-4 py-3 label-caps text-ink transition-colors hover:bg-sunken"
              >
                <Mail className="h-4 w-4" />
                Email admissions
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

function stageColor(status: string) {
  switch (status) {
    case "enrollment-confirmed":
    case "payment-verified":
      return "bg-success/10 text-success border border-success/20";
    case "payment-submitted":
      return "bg-accent/10 text-ink border border-accent/20";
    case "approved":
      return "bg-success/10 text-success border border-success/20";
    case "under-review":
    case "awaiting-payment":
      return "bg-warning/10 text-warning border border-warning/20";
    case "pending-review":
      return "bg-muted/10 text-muted border border-line";
    case "rejected":
      return "bg-danger/10 text-danger border border-danger/20";
    default:
      return "bg-muted/10 text-muted border border-line";
  }
}

function paymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    none: "Not required",
    submitted: "Submitted — awaiting verification",
    verified: "Verified",
    rejected: "Rejected — re-upload required",
  };
  return labels[status] || status;
}

function paymentStatusColor(status: string) {
  switch (status) {
    case "verified":
      return "text-success";
    case "submitted":
      return "text-ink";
    case "rejected":
      return "text-danger";
    default:
      return "text-muted";
  }
}
