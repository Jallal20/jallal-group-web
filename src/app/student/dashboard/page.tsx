import { getCurrentStudent } from "@/lib/student-auth";
import { getApplicationsByStudent } from "@/lib/applications";
import { getEnrollmentsByStudent } from "@/lib/program-enrollments";
import { getAnnouncementsForStudent } from "@/lib/program-announcements";
import { getUnreadCount, listNotifications } from "@/lib/notifications";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils-date";
import { StudentSignOutButton } from "@/components/student/sign-out-button";
import { Bell, FileText, GraduationCap, Megaphone } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  submitted: "bg-muted/10 text-muted border border-line",
  "under-review": "bg-accent/10 text-ink border border-accent/20",
  shortlisted: "bg-accent/10 text-ink border border-accent/20",
  approved: "bg-success/10 text-success border border-success/20",
  rejected: "bg-danger/10 text-danger border border-danger/20",
  waitlisted: "bg-muted/10 text-muted border border-muted/20",
  withdrawn: "bg-danger/10 text-danger border border-danger/20",
};

export default async function StudentDashboardPage() {
  const student = await getCurrentStudent();
  if (!student) {
    redirect("/student/login");
  }

  const [applications, enrollments, announcements, unreadCount, notifications] =
    await Promise.all([
      getApplicationsByStudent(student.id),
      getEnrollmentsByStudent(student.id),
      getAnnouncementsForStudent(student.id),
      getUnreadCount(student.id),
      listNotifications({ userId: student.id, limit: 10 }),
    ]);

  const approvedApplications = applications.filter((a) => a.status === "approved");
  const pendingApplications = applications.filter(
    (a) => a.status === "submitted" || a.status === "under-review" || a.status === "shortlisted",
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Student Portal</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Welcome back, {student.fullName}
          </h1>
          <p className="text-body-md text-muted">
            Student ID: <span className="font-mono text-ink">{student.studentId}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StudentSignOutButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <p className="text-label-sm text-muted uppercase tracking-wider">Total applications</p>
          <p className="text-headline-md font-bold text-ink">{applications.length}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <p className="text-label-sm text-muted uppercase tracking-wider">Pending review</p>
          <p className="text-headline-md font-bold text-accent">{pendingApplications.length}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <p className="text-label-sm text-muted uppercase tracking-wider">Approved</p>
          <p className="text-headline-md font-bold text-success">{approvedApplications.length}</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <p className="text-label-sm text-muted uppercase tracking-wider">Unread notifications</p>
          <p className="text-headline-md font-bold text-ink">{unreadCount}</p>
        </div>
      </div>

      {/* Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-headline-sm font-semibold text-ink">My applications</h2>
            <Link href="/student/login" className="text-label-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          {applications.length === 0 ? (
            <div className="rounded-lg border border-line bg-surface p-8 text-center">
              <FileText className="h-10 w-10 text-muted mx-auto mb-3" />
              <p className="text-body-sm text-ink">No applications yet.</p>
              <p className="mt-2 text-body-sm text-muted">
                Apply for a training program to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-body-sm font-semibold text-ink truncate">{app.activityTitle}</p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                        STATUS_COLORS[app.status] || "bg-muted/10 text-muted border border-line",
                      )}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-body-sm text-muted">{app.reference}</p>
                  <p className="text-xs text-muted">
                    Submitted {formatDate(app.createdAt)}
                  </p>
                  {app.decisionMessage && (
                    <p className="mt-2 text-body-sm text-ink">{app.decisionMessage}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enrolled programs */}
        <div className="flex-1">
          <h2 className="text-headline-sm font-semibold text-ink mb-4">My enrolled programs</h2>
          {enrollments.length === 0 ? (
            <div className="rounded-lg border border-line bg-surface p-8 text-center">
              <GraduationCap className="h-10 w-10 text-muted mx-auto mb-3" />
              <p className="text-body-sm text-ink">No enrolled programs.</p>
              <p className="mt-2 text-body-sm text-muted">
                Get approved for a program to start learning.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.slice(0, 5).map((enrollment) => (
                <div key={enrollment.id} className="rounded-lg border border-line bg-white p-4">
                  <p className="text-body-sm font-semibold text-ink">{enrollment.activityTitle}</p>
                  <p className="text-body-sm text-muted">{enrollment.instructor || "Instructor TBD"}</p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-label-xs font-medium border",
                      enrollment.status === "active"
                        ? "bg-success/10 text-success border border-success/20"
                        : enrollment.status === "completed"
                          ? "bg-accent/10 text-ink border border-accent/20"
                          : "bg-muted/10 text-muted border border-line",
                    )}
                  >
                    {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      <div className="rounded-lg border border-line bg-white shadow-card overflow-hidden">
        <div className="border-b border-line px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-accent" />
            <h2 className="text-headline-sm font-semibold text-ink">Announcements</h2>
          </div>
          {announcements.length === 0 ? null : (
            <Link href="/student/dashboard" className="text-label-sm text-accent hover:underline">
              View all
            </Link>
          )}
        </div>
        <div className="divide-y divide-line">
          {announcements.length === 0 ? (
            <div className="px-6 py-8 text-center text-body-sm text-muted">
              No announcements at this time.
            </div>
          ) : (
            announcements.slice(0, 5).map((ann) => (
              <div key={ann.id} className="px-6 py-4">
                <p className="text-body-sm font-semibold text-ink">{ann.title}</p>
                <p className="text-body-sm text-muted line-clamp-2">{ann.message}</p>
                <p className="text-xs text-muted mt-1">
                  {ann.audience} • {formatDate(ann.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notifications */}
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
            notifications.items.slice(0, 5).map((notif) => (
              <div key={notif.id} className="px-6 py-4 group cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-body-sm font-semibold text-ink">{notif.title}</p>
                  {!notif.read && (
                    <span className="h-2 w-2 rounded-full bg-accent" />
                  )}
                </div>
                <p className="text-body-sm text-muted line-clamp-2">{notif.message}</p>
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

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
