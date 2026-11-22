import Link from "next/link";
import { GraduationCap, BookOpen, Users, Building2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Jallal Institute of Technology" };
export const dynamic = "force-dynamic";

const MODULES = [
  {
    key: "courses",
    label: "Courses",
    href: "/admin/jallal-institute/courses",
    icon: BookOpen,
    description: "Manage course catalogue, descriptions, fees and publication.",
  },
  {
    key: "enrollments",
    label: "Enrollments",
    href: "/admin/jallal-institute/enrollments",
    icon: Users,
    description: "Review and decide student enrolment applications.",
  },
  {
    key: "course-categories",
    label: "Course Categories",
    href: "/admin/course-categories",
    icon: Building2,
    description: "Organise courses into public categories.",
  },
];

export default function JallalInstitutePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Jallal Institute of Technology</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Education Management
        </h1>
        <p className="text-body-md text-muted">
          Manage courses, categories and student enrolments. Published courses
          appear on the public course catalogue.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {MODULES.map((module) => (
          <Link
            key={module.key}
            href={module.href}
            className="rounded-lg border border-line bg-white p-6 shadow-card hover-lift"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-rich text-white">
                <module.icon className="h-5 w-5" />
              </div>
              <span className="text-headline-sm font-semibold text-ink">
                {module.label}
              </span>
            </div>
            <p className="text-body-sm text-muted">
              {module.description}
            </p>
          </Link>
        ))}
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
