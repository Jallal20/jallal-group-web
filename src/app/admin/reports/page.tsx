import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
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
  listProjects as listElevate,
} from "@/lib/elevate-projects";
import {
  listProjects as listTech,
} from "@/lib/tech-projects";
import {
  listDigitalVentures,
} from "@/lib/digital-ventures";
import { inquiryStats } from "@/lib/inquiries";
import {
  listAdminProfiles,
} from "@/lib/admin-profiles";
import {
  Layers,
  MailOpen,
  Users,
  Clock,
  Rocket,
  ShieldCheck,
  BarChart3,
  Download,
} from "lucide-react";

export const metadata: Metadata = { title: "Reports & Analytics" };
export const dynamic = "force-dynamic";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

type ReportCard = {
  label: string;
  value: number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default async function ReportsPage() {
  await requireAdmin();

  const props = { total: 0, available: 0, sold: 0, rented: 0 };
  const courses = { total: 0, published: 0 };
  const enrollments = { total: 0, pending: 0, accepted: 0 };
  const elevate = { total: 0, published: 0 };
  const tech = { total: 0, published: 0 };
  const ventures = { total: 0, published: 0 };
  const inquiries = { total: 0, pending: 0 };
  const admins = { total: 0, active: 0 };

  try {
    const [
      pRes, cRes, eRes, elRes, tRes, vRes, iRes, aRes,
    ] = await Promise.allSettled([
      listProperties({ limit: 1 }),
      listCourses({ limit: 1 }),
      listEnrollments({ limit: 1 }),
      listElevate({ limit: 1 }),
      listTech({ limit: 1 }),
      listDigitalVentures({ limit: 1 }),
      inquiryStats(),
      listAdminProfiles({ limit: 1 }),
    ]);

    if (pRes.status === "fulfilled") {
      const p = pRes.value.items;
      props.total = pRes.value.total;
      props.available = p.filter((x) => x.status === "available").length;
      props.sold = p.filter((x) => x.status === "sold").length;
      props.rented = p.filter((x) => x.status === "rented").length;
    }
    if (cRes.status === "fulfilled") {
      const c = cRes.value.items;
      courses.total = cRes.value.total;
      courses.published = c.filter((x) => x.published).length;
    }
    if (eRes.status === "fulfilled") {
      const e = eRes.value.items;
      enrollments.total = eRes.value.total;
      enrollments.pending = e.filter((x) => x.status === "pending").length;
      enrollments.accepted = e.filter(
        (x) => x.status === "accepted" || x.status === "enrolled",
      ).length;
    }
    if (elRes.status === "fulfilled") {
      const el = elRes.value.items;
      elevate.total = elRes.value.total;
      elevate.published = el.filter((x) => x.published).length;
    }
    if (tRes.status === "fulfilled") {
      const t = tRes.value.items;
      tech.total = tRes.value.total;
      tech.published = t.filter((x) => x.published).length;
    }
    if (vRes.status === "fulfilled") {
      const v = vRes.value.items;
      ventures.total = vRes.value.total;
      ventures.published = v.filter((x) => x.published).length;
    }
    if (iRes.status === "fulfilled") {
      inquiries.total = iRes.value.total;
      inquiries.pending = iRes.value.pending;
    }
    if (aRes.status === "fulfilled") {
      admins.total = aRes.value.total;
      admins.active = aRes.value.items.filter((x) => x.status === "active").length;
    }
  } catch {
    // Keep zeros.
  }

  const cards: ReportCard[] = [
    { label: "Property Listings", value: props.total, sub: `${props.available} available - ${props.sold} sold - ${props.rented} rented`, icon: Layers },
    { label: "Property Inquiries", value: props.total, sub: "Listings receiving inquiries", icon: MailOpen },
    { label: "Student Enrollments", value: enrollments.total, sub: `${enrollments.pending} pending - ${enrollments.accepted} accepted`, icon: Users },
    { label: "Course Performance", value: courses.total, sub: `${courses.published} published`, icon: Clock },
    { label: "Elevate 360 Projects", value: elevate.total, sub: `${elevate.published} published`, icon: Rocket },
    { label: "Jallal Tech Projects", value: tech.total, sub: `${tech.published} published`, icon: ShieldCheck },
    { label: "Digital Ventures", value: ventures.total, sub: `${ventures.published} launched`, icon: Rocket },
    { label: "Administrative Activity", value: admins.total, sub: `${admins.active} active administrators`, icon: BarChart3 },
  ];

  const reportGroups = [
    {
      label: "Property Listings",
      icon: Layers,
      href: "/api/reports/properties.csv",
      stat: props.total,
      sub: "All property records",
    },
    {
      label: "Student Enrollments",
      icon: Users,
      href: "/api/reports/enrollments.csv",
      stat: enrollments.total,
      sub: `${enrollments.pending} pending`,
    },
    {
      label: "Partnership Inquiries",
      icon: MailOpen,
      href: "/api/reports/inquiries.csv",
      stat: inquiries.total,
      sub: `${inquiries.pending} new`,
    },
    {
      label: "Courses",
      icon: Clock,
      href: "/api/reports/courses.csv",
      stat: courses.total,
      sub: `${courses.published} published`,
    },
    {
      label: "Elevate 360 Projects",
      icon: Rocket,
      href: "/api/reports/elevate-projects.csv",
      stat: elevate.total,
      sub: `${elevate.published} published`,
    },
    {
      label: "Jallal Tech Projects",
      icon: ShieldCheck,
      href: "/api/reports/tech-projects.csv",
      stat: tech.total,
      sub: `${tech.published} published`,
    },
    {
      label: "Digital Ventures",
      icon: Rocket,
      href: "/api/reports/digital-ventures.csv",
      stat: ventures.total,
      sub: `${ventures.published} published`,
    },
    {
      label: "Administrative Activity",
      icon: BarChart3,
      href: "/api/reports/admin-profiles.csv",
      stat: admins.total,
      sub: `${admins.active} active`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Reports &amp; Analytics</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Reports &amp; Analytics
        </h1>
        <p className="text-body-md text-muted">
          All figures are calculated from actual Appwrite database records. Use
          the CSV links to export each report.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <ReportCard key={card.label} {...card} />
        ))}
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-card">
        <h2 className="text-headline-sm font-semibold text-ink mb-4">Exportable Reports</h2>
        <p className="text-body-sm text-muted mb-4">
          Each report below is generated live from Appwrite and delivered as
          CSV. Reports reflect current records only.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {reportGroups.map((report) => (
            <a
              key={report.label}
              href={report.href}
              target="_blank"
              rel="noopener"
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white p-4 transition-colors hover:border-accent/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface text-ink">
                  <report.icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-body-sm font-semibold text-ink block">
                    {report.label}
                  </span>
                  <span className="text-label-sm text-muted">{report.sub}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-headline-sm font-bold text-ink">
                  {formatNumber(report.stat)}
                </span>
                <Download className="h-4 w-4 text-accent" />
              </div>
            </a>
          ))}
        </div>

        <p className="mt-4 text-body-sm text-muted">
          Partnership inquiries and enrollments use the public submission
          statuses configured in the dashboard. Property figures include all
          listings regardless of publication state.
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

function ReportCard({
  label,
  value,
  sub,
  icon: Icon,
}: ReportCard) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <span className="label-caps text-muted">{label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface text-ink">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="text-headline-lg font-bold text-ink">{formatNumber(value)}</div>
      <p className="mt-1 text-body-sm text-muted">{sub}</p>
    </div>
  );
}
