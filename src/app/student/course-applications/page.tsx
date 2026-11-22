import { getCurrentStudent } from "@/lib/student-auth";
import { redirect } from "next/navigation";
import { getCourseApplicationsByStudent } from "@/lib/course-applications";
import { getCoursePaymentByApplication } from "@/lib/course-payments";
import { getUnreadCount, listNotifications } from "@/lib/notifications";
import Link from "next/link";
import { formatDate } from "@/lib/utils-date";
import { StudentSignOutButton } from "@/components/student/sign-out-button";
import { Bell, FileText, GraduationCap, Clock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default async function StudentCourseApplicationsPage() {
  const student = await getCurrentStudent();
  if (!student) {
    redirect("/student/login");
  }

  const [applications, unreadCount, notifications] = await Promise.all([
    getCourseApplicationsByStudent(student.id),
    getUnreadCount(student.id),
    listNotifications({ userId: student.id, limit: 10 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Student Portal</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            My course applications
          </h1>
          <p className="text-body-md text-muted">
            Student ID:{" "}
            <span className="font-mono text-ink">{student.studentId}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StudentSignOutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <p className="text-label-sm text-muted uppercase tracking-wider">
            Total applications
          </p>
          <p className="text-headline-md font-bold text-ink">
            {applications.length}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <p className="text-label-sm text-muted uppercase tracking-wider">
            Pending review
          </p>
          <p className="text-headline-md font-bold text-accent">
            {applications.filter(
              (a) => a.status === "pending-review" || a.status === "under-review",
            ).length}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <p className="text-label-sm text-muted uppercase tracking-wider">
            Approved
          </p>
          <p className="text-headline-md font-bold text-success">
            {applications.filter((a) => a.status === "approved").length}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <p className="text-label-sm text-muted uppercase tracking-wider">
            Confirmed enrolments
          </p>
          <p className="text-headline-md font-bold text-success">
            {applications.filter((a) => a.status === "enrollment-confirmed").length}
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <p className="text-label-sm text-muted uppercase tracking-wider">
            Unread notifications
          </p>
          <p className="text-headline-md font-bold text-ink">{unreadCount}</p>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white shadow-card overflow-hidden">
        <div className="border-b border-line px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <h2 className="text-headline-sm font-semibold text-ink">Applications</h2>
          </div>
        </div>
        <div className="divide-y divide-line">
          {applications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted mx-auto mb-4" />
              <p className="text-body-sm text-ink">No course applications yet.</p>
              <p className="mt-2 text-body-sm text-muted">
                Browse the course catalogue and apply for a course to get
                started.
              </p>
              <div className="mt-6">
                <Link href="/courses" className="inline-flex items-center gap-2 label-caps text-accent hover:underline">
                  Browse courses <span className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            applications.map((app) => {
              const paymentStage = STAGE_INDEX[app.status] ?? 0;
              return (
                <div key={app.id} className="px-6 py-5 group hover:bg-sunken/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-body-sm font-semibold text-ink truncate">
                          {app.courseName}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                            stageColor(app.status),
                          )}
                        >
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1).replace("-", " ")}
                        </span>
                      </div>
                      <p className="text-body-sm text-muted">
                        {app.email} · {app.phone}
                      </p>
                      <p className="text-label-sm text-muted truncate">
                        Reference: {app.reference}
                      </p>
                      <p className="text-label-sm text-muted">
                        Submitted {formatDate(app.createdAt)}
                      </p>
                    </div>
                    <Link
                      href={`/student/course-applications/${app.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-3 py-2 label-caps text-ink transition-colors hover:border-ink"
                    >
                      View <Mail className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                  <div className="mt-4">
                    <p className="label-caps text-muted mb-2">Progress</p>
                    <div className="flex gap-1">
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
                  {app.paymentStatus !== "none" && (
                    <div className="mt-3 flex items-center gap-2 text-label-sm">
                      <Clock className="h-3.5 w-3.5 text-muted shrink-0" />
                      <span className="text-muted">
                        Payment:{nbspMap(app.paymentStatus)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-white shadow-card overflow-hidden">
        <div className="border-b border-line px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            <h2 className="text-headline-sm font-semibold text-ink">Notifications</h2>
          </div>
          {unreadCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </div>
        <div className="divide-y divide-line">
          {notifications.items.length === 0 ? (
            <div className="px-6 py-8 text-center text-body-sm text-muted">
              No notifications at this time.
            </div>
          ) : (
            notifications.items.map((notif) => (
              <div key={notif.id} className="px-6 py-4 group cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-body-sm font-semibold text-ink">
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  )}
                </div>
                <p className="text-body-sm text-muted line-clamp-2">
                  {notif.message}
                </p>
                <p className="text-xs text-muted mt-1">
                  {formatDate(notif.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function nbspMap(value: string) {
  const labels: Record<string, string> = {
    none: "Not required",
    submitted: "Submitted — awaiting verification",
    verified: "Verified",
    rejected: "Rejected",
  };
  return labels[value] || value;
}
