import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  listCompanies,
} from "@/lib/companies-management";
import {
  listProperties,
} from "@/lib/properties";
import {
  listCourses,
} from "@/lib/courses";
import {
  listEnrollments,
} from "@/lib/enrollments";
import {
  listProjects as listElevateProjects,
} from "@/lib/elevate-projects";
import {
  listProjects as listTechProjects,
} from "@/lib/tech-projects";
import {
  listDigitalVentures,
} from "@/lib/digital-ventures";
import {
  listInquiries,
  inquiryStats,
} from "@/lib/inquiries";
import {
  listAdminProfiles,
} from "@/lib/admin-profiles";
import {
  listNotifications,
  getUnreadCount,
} from "@/lib/notifications";
import {
  ShieldCheck,
  Building2,
  Users,
  Layers,
  Rocket,
  GraduationCap,
  Folder,
  MailOpen,
  Activity,
  Settings,
  BarChart3,
  Clock,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function sparkline(values: number[]): string {
  if (values.length === 0) return "";
  const max = Math.max(...values);
  if (max === 0) return values.map(() => "10,50").join(" ");
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 50 - (v / max) * 40;
    return `${x},${y}`;
  });
  return points.join(" ");
}

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();

  let stats = {
    companies: 0,
    activeAdmins: 0,
    digitalVentures: 0,
    publishedProjects: 0,
    properties: 0,
    availableProperties: 0,
    soldProperties: 0,
    rentedProperties: 0,
    newInquiries: 0,
    courses: 0,
    publishedCourses: 0,
    totalEnrollments: 0,
    pendingEnrollments: 0,
    acceptedEnrollments: 0,
    elevateInitiatives: 0,
    elevatePublished: 0,
    techProjects: 0,
    techPublished: 0,
    unreadNotifications: 0,
  };

  try {
    const [
      companiesResult,
      propertiesResult,
      coursesResult,
      enrollmentsResult,
      elevateResult,
      techResult,
      venturesResult,
      inquiriesResult,
      adminsResult,
      notificationsResult,
    ] = await Promise.allSettled([
      listCompanies({ limit: 1 }),
      listProperties({ limit: 1 }),
      listCourses({ limit: 1 }),
      listEnrollments({ limit: 1 }),
      listElevateProjects({ limit: 1 }),
      listTechProjects({ limit: 1 }),
      listDigitalVentures({ limit: 1 }),
      inquiryStats(),
      listAdminProfiles({ limit: 1 }),
      listNotifications({ limit: 1 }),
    ]);

    if (companiesResult.status === "fulfilled")
      stats.companies = companiesResult.value.total;
    if (propertiesResult.status === "fulfilled") {
      const p = propertiesResult.value.items;
      stats.properties = propertiesResult.value.total;
      stats.availableProperties = p.filter((x) => x.status === "available").length;
      stats.soldProperties = p.filter((x) => x.status === "sold").length;
      stats.rentedProperties = p.filter((x) => x.status === "rented").length;
    }
    if (coursesResult.status === "fulfilled") {
      const c = coursesResult.value.items;
      stats.courses = coursesResult.value.total;
      stats.publishedCourses = c.filter((x) => x.published).length;
    }
    if (enrollmentsResult.status === "fulfilled") {
      const e = enrollmentsResult.value.items;
      stats.totalEnrollments = enrollmentsResult.value.total;
      stats.pendingEnrollments = e.filter((x) => x.status === "pending").length;
      stats.acceptedEnrollments = e.filter(
        (x) => x.status === "accepted" || x.status === "enrolled",
      ).length;
    }
    if (elevateResult.status === "fulfilled") {
      const ep = elevateResult.value.items;
      stats.elevateInitiatives = elevateResult.value.total;
      stats.elevatePublished = ep.filter((x) => x.published).length;
    }
    if (techResult.status === "fulfilled") {
      const tp = techResult.value.items;
      stats.techProjects = techResult.value.total;
      stats.techPublished = tp.filter((x) => x.published).length;
    }
    if (venturesResult.status === "fulfilled") {
      const v = venturesResult.value.items;
      stats.digitalVentures = venturesResult.value.total;
      stats.publishedProjects =
        v.filter((x) => x.published).length +
        stats.elevatePublished +
        stats.techPublished;
    }
    if (inquiriesResult.status === "fulfilled") {
      stats.newInquiries = inquiriesResult.value.pending;
    }
    if (adminsResult.status === "fulfilled")
      stats.activeAdmins = adminsResult.value.items.filter(
        (x) => x.status === "active",
      ).length;
    if (notificationsResult.status === "fulfilled") {
      stats.unreadNotifications = await getUnreadCount(admin.id).catch(() => 0);
    }
  } catch {
    // Keep zeros if backend unavailable.
  }

  const moduleKeys = admin.permissions;

  const recentActivity = [
    {
      title: "Dashboard overview loaded",
      module: "System",
      time: "Just now",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Dashboard</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Welcome back, {admin.name.split(" ")[0]}.
          </h1>
          <p className="text-body-md text-muted">
            Central management for Jallal Group — live figures from Appwrite.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 label-caps text-ink transition-colors hover:bg-sunken"
          >
            <ExternalLinkIcon className="h-4 w-4" /> View public site
          </Link>
          {stats.unreadNotifications > 0 && (
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-ink">
              <BellIcon className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white text-[10px]">
                {stats.unreadNotifications}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <MetricCard
          label="Total Companies"
          value={formatNumber(stats.companies)}
          sub="Portfolio companies"
          icon={Building2}
          color="bg-forest text-white"
        />
        <MetricCard
          label="Active Administrators"
          value={formatNumber(stats.activeAdmins)}
          sub="Super & Sub-Admins"
          icon={Users}
          color="bg-rich text-white"
        />
        <MetricCard
          label="Digital Ventures"
          value={formatNumber(stats.digitalVentures)}
          sub="Venture studio"
          icon={Rocket}
          color="bg-accent text-ink"
        />
        <MetricCard
          label="Published Projects"
          value={formatNumber(stats.publishedProjects)}
          sub="Across all companies"
          icon={BarChart3}
          color="bg-accent text-ink"
        />
        <MetricCard
          label="New Partnership Inquiries"
          value={formatNumber(stats.newInquiries)}
          sub="Awaiting review"
          icon={MailOpen}
          color="bg-rich text-white"
        />
        <MetricCard
          label="Total Properties"
          value={formatNumber(stats.properties)}
          sub="Available · Sold · Rented"
          icon={Folder}
          color="bg-forest text-white"
        />
        <MetricCard
          label="Total Courses"
          value={formatNumber(stats.courses)}
          sub={stats.publishedCourses > 0 ? `${stats.publishedCourses} published` : "None published"}
          icon={GraduationCap}
          color="bg-rich text-white"
        />
        <MetricCard
          label="Total Enrollments"
          value={formatNumber(stats.totalEnrollments)}
          sub={stats.pendingEnrollments > 0 ? `${stats.pendingEnrollments} pending` : "All reviewed"}
          icon={Clock}
          color="bg-accent text-ink"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Properties panel */}
        <div className="lg:col-span-1 rounded-lg border border-line bg-white p-5 shadow-card">
          <h2 className="text-headline-sm font-semibold text-ink mb-4">Jallal Properties</h2>
          <div className="space-y-3">
            <StatRow label="Available" value={stats.availableProperties} icon="home" />
            <StatRow label="Sold" value={stats.soldProperties} icon="check" />
            <StatRow label="Rented" value={stats.rentedProperties} icon="layout" />
            <StatRow label="Total" value={stats.properties} icon="building" />
          </div>
          <div className="mt-5 rounded-md border border-line p-3 text-center">
            <div className="text-[10px] text-muted uppercase tracking-wider mb-1">Status mix</div>
            <svg className="mx-auto h-8 w-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="16" cy="16" r="12" strokeOpacity="0.15" />
              <path
                strokeDasharray={
                  sparkline([
                    stats.availableProperties,
                    stats.soldProperties,
                    stats.rentedProperties,
                    stats.properties,
                  ])
                }
                strokeDashoffset="0"
                className="transition-all duration-1000"
                d="M4 16 A12 12 0 0 1 28 16 A12 12 0 0 1 4 16"
                stroke="var(--color-accent)"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Institute panel */}
        <div className="lg:col-span-1 rounded-lg border border-line bg-white p-5 shadow-card">
          <h2 className="text-headline-sm font-semibold text-ink mb-4">Jallal Institute</h2>
          <div className="space-y-3">
            <StatRow label="Courses" value={stats.courses} icon="graduation" />
            <StatRow label="Published" value={stats.publishedCourses} icon="check" />
            <StatRow label="Enrollments" value={stats.totalEnrollments} icon="users" />
            <StatRow label="Pending" value={stats.pendingEnrollments} icon="clock" />
            <StatRow label="Accepted" value={stats.acceptedEnrollments} icon="check" />
          </div>
        </div>

        {/* Ventures / Elevate / Tech panel */}
        <div className="lg:col-span-1 rounded-lg border border-line bg-white p-5 shadow-card">
          <h2 className="text-headline-sm font-semibold text-ink mb-4">Ventures & Initiatives</h2>
          <div className="space-y-3">
            <StatRow label="Digital ventures" value={stats.digitalVentures} icon="rocket" />
            <StatRow label="Elevate 360" value={stats.elevateInitiatives} icon="trending" />
            <StatRow label="Elevate published" value={stats.elevatePublished} icon="check" />
            <StatRow label="Jallal Tech" value={stats.techProjects} icon="layers" />
            <StatRow label="Tech published" value={stats.techPublished} icon="check" />
          </div>
        </div>
      </div>

      {/* Recent activity / notifications */}
      <div className="rounded-lg border border-line bg-white p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-headline-sm font-semibold text-ink">Recent administrative activity</h2>
          <Link
            href="/admin/audit-logs"
            className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 label-caps text-ink transition-colors hover:bg-accent hover:text-white"
          >
            View audit log <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="text-body-sm text-muted">
          All administrative actions are recorded in the audit log. View the full
          history for accountability and compliance.
        </p>
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

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-card hover-lift">
      <div className="flex items-center justify-between mb-3">
        <span className="label-caps text-muted">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-headline-lg font-bold text-ink">{value}</div>
      <p className="mt-1 text-body-sm text-muted">{sub}</p>
    </div>
  );
}

function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  const Icon = STAT_ICONS[icon];
  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-line/50 bg-surface/50">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white">
          <Icon className="h-3.5 w-3.5 text-muted" />
        </div>
        <span className="text-body-sm text-muted">{label}</span>
      </div>
      <span className="text-body-sm font-semibold text-ink">{formatNumber(value)}</span>
    </div>
  );
}

const STAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: HomeIcon,
  check: CheckIcon,
  layout: LayoutIcon,
  building: Building2,
  graduation: GraduationCap,
  users: Users,
  clock: Clock,
  rocket: Rocket,
  trending: TrendingUp,
  layers: Layers,
};

function ExternalLinkIcon({ className }: { className?: string }) {
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
      <path d="M15 13H6a2 2 0 0 1-2-2V6" />
      <path d="M18 6V3a2 2 0 0 1 2 2h3" />
      <polyline points="18 6 12 12 6 6" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
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
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
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
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
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
      <path d="M5 12l5-5 5 5" />
      <polyline points="12 2 12 12 22 12" />
      <path d="M2 21h20V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v13" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LayoutIcon({ className }: { className?: string }) {
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <line x1="3" x2="21" y1="11" y2="11" />
    </svg>
  );
}
