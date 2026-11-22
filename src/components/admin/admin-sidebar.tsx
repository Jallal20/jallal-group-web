"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  Bell,
  Folder,
  GraduationCap,
  Home,
  MailOpen,
  Rocket,
  ShieldCheck,
  Settings,
  Terminal,
  User,
  Users,
  Activity,
  BarChart3,
  Palette,
  Lock,
  Globe,
  FileText,
  FileCheck,
  Scroll,
  BookOpen,
  Megaphone,
} from "lucide-react";
import type { AdminPermission } from "@/lib/types";

interface AdminModuleItem {
  key: string;
  label: string;
  href: string;
  permission: AdminPermission | null;
}

interface AdminModule {
  key: string;
  label: string;
  href: string;
  icon: React.ElementType;
  permission: AdminPermission | null;
  group: string | null;
  items?: AdminModuleItem[];
}

const MODULES: AdminModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: Home,
    permission: null,
    group: null,
  },
  {
    key: "companies",
    label: "Companies",
    href: "/admin/companies",
    icon: Building2,
    permission: "companies.manage",
    group: null,
  },
  {
    key: "jallal-tech",
    label: "Jallal Tech",
    href: "/admin/jallal-tech",
    icon: Terminal,
    permission: "techProjects.manage",
    group: null,
  },
  {
    key: "jallal-institute",
    label: "Jallal Institute of Technology",
    href: "/admin/jallal-institute",
    icon: GraduationCap,
    permission: "courses.manage",
    group: "institute",
      items: [
        { key: "courses", label: "Courses", href: "/admin/jallal-institute/courses", permission: "courses.manage" },
        { key: "enrollments", label: "Enrollments", href: "/admin/jallal-institute/enrollments", permission: "enrollments.manage" },
        { key: "course-categories", label: "Course Categories", href: "/admin/course-categories", permission: "courses.manage" },
        { key: "course-applications", label: "Course Enrollments", href: "/admin/jallal-institute/course-applications", permission: "courseApplications.manage" },
        { key: "course-payments", label: "Payment Verification", href: "/admin/jallal-institute/payments", permission: "coursePayments.manage" },
      ],
  },
  {
    key: "jallal-properties",
    label: "Jallal Properties Group",
    href: "/admin/jallal-properties",
    icon: Folder,
    permission: "properties.manage",
    group: "properties",
    items: [
      { key: "properties", label: "Properties", href: "/admin/jallal-properties/properties", permission: "properties.manage" },
      { key: "projects", label: "Major Projects", href: "/admin/jallal-properties/projects", permission: "propertyProjects.manage" },
    ],
  },
  {
    key: "elevate-360",
    label: "Elevate 360",
    href: "/admin/elevate-360",
    icon: Rocket,
    permission: "elevateProjects.manage",
    group: null,
  },
  {
    key: "training-activities",
    label: "Training Activities",
    href: "/admin/training-activities",
    icon: GraduationCap,
    permission: "activities.manage",
    group: "training",
  },
  {
    key: "training-application-forms",
    label: "Application Forms",
    href: "/admin/training-application-forms",
    icon: FileText,
    permission: "applicationForms.manage",
    group: "training",
  },
  {
    key: "training-applications",
    label: "Applications",
    href: "/admin/training-applications",
    icon: FileCheck,
    permission: "applications.manage",
    group: "training",
  },
  {
    key: "training-students",
    label: "Students",
    href: "/admin/training-students",
    icon: Users,
    permission: "students.manage",
    group: "training",
  },
  {
    key: "training-programs",
    label: "Program Enrollments",
    href: "/admin/training-programs",
    icon: Scroll,
    permission: "programs.manage",
    group: "training",
  },
  {
    key: "training-learning-materials",
    label: "Learning Materials",
    href: "/admin/training-learning-materials",
    icon: BookOpen,
    permission: "programs.manage",
    group: "training",
  },
  {
    key: "training-program-announcements",
    label: "Program Announcements",
    href: "/admin/training-program-announcements",
    icon: Megaphone,
    permission: "programs.manage",
    group: "training",
  },
  {
    key: "partnership-inquiries",
    label: "Partnership Inquiries",
    href: "/admin/inquiries",
    icon: MailOpen,
    permission: "companies.manage",
    group: null,
  },
  {
    key: "user-management",
    label: "User Management",
    href: "/admin/admin-profiles",
    icon: Users,
    permission: "users.manage",
    group: null,
  },
  {
    key: "admin-roles",
    label: "Admin Roles",
    href: "/admin/roles",
    icon: ShieldCheck,
    permission: "users.manage",
    group: null,
  },
  {
    key: "notifications",
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    permission: "content.manage",
    group: null,
  },
  {
    key: "digital-ventures",
    label: "Digital Ventures",
    href: "/admin/digital-ventures",
    icon: Rocket,
    permission: "content.manage",
    group: null,
  },
  {
    key: "projects",
    label: "Projects & Events",
    href: "/admin/projects",
    icon: Rocket,
    permission: "projects.manage",
    group: null,
  },
  {
    key: "audit-logs",
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: Activity,
    permission: "auditLogs.view",
    group: null,
  },
  {
    key: "site-settings",
    label: "Site Settings",
    href: "/admin/site-settings",
    icon: Settings,
    permission: "settings.manage",
    group: null,
  },
  {
    key: "media-library",
    label: "Media Library",
    href: "/admin/media-library",
    icon: Palette,
    permission: "content.manage",
    group: null,
  },
  {
    key: "reports",
    label: "Reports & Analytics",
    href: "/admin/reports",
    icon: BarChart3,
    permission: "auditLogs.view",
    group: null,
  },
  {
    key: "general-settings",
    label: "General Settings",
    href: "/admin/general-settings",
    icon: Globe,
    permission: "settings.manage",
    group: null,
  },
  {
    key: "security-settings",
    label: "Security Settings",
    href: "/admin/security-settings",
    icon: Lock,
    permission: "settings.manage",
    group: null,
  },
];

export interface AdminSidebarProps {
  admin: { name: string; email: string; roles: string[]; isSuperAdmin: boolean };
  authorisedModuleKeys: string[];
}

export function AdminSidebar({
  admin,
  authorisedModuleKeys,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const hasPermission = (permission: AdminPermission | null) =>
    !permission || authorisedModuleKeys.includes(permission as string);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const groupOpen = (key: string) => openGroups.has(key);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-forest text-white transform transition-transform duration-300 ease-in-out",
        collapsed ? "-translate-x-full" : "translate-x-0",
        "lg:relative lg:translate-x-0 lg:w-64 lg:shadow-none",
      )}
      aria-label="Admin navigation"
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10 bg-forest/95">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-lime" />
          <span className="font-bold label-caps tracking-tight">
            Jallal Group
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="lg:hidden p-1.5 rounded-md text-white hover:bg-white/10 transition-colors"
        >
          {collapsed ? (
            <ChevronIcon className="h-5 w-5" />
          ) : (
            <ChevronIcon className="h-5 w-5 rotate-180" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <nav>
          {MODULES.map((module) => {
            if (module.permission && !hasPermission(module.permission)) {
              return null;
            }

            if (module.items) {
              const visibleItems = module.items.filter((item) =>
                hasPermission(item.permission),
              );
              if (visibleItems.length === 0) return null;

              return (
                <div
                  key={module.key}
                  className="rounded-lg overflow-hidden border border-white/10"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(module.key)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors group hover:bg-white/10"
                  >
                    <module.icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{module.label}</span>
                    <ChevronIcon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        groupOpen(module.key) ? "rotate-180" : "",
                      )}
                    />
                  </button>
                  {groupOpen(module.key) && (
                    <div className="bg-white/5 border-t border-white/10">
                      {visibleItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => router.refresh()}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                              active
                                ? "bg-accent text-ink font-semibold"
                                : "text-on-dark-muted hover:bg-white/10 hover:text-white",
                            )}
                          >
                            <ChevronIcon className="h-3 w-3 shrink-0 text-on-dark-muted" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const active = isActive(module.href);
            return (
              <Link
                key={module.key}
                href={module.href}
                onClick={() => router.refresh()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-lg",
                  active
                    ? "bg-accent text-ink font-semibold"
                    : "text-on-dark-muted hover:bg-white/10 hover:text-white",
                )}
              >
                <module.icon className="h-5 w-5 shrink-0" />
                {module.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="px-3 pb-2">
            <p className="text-xs text-on-dark-muted/60 uppercase tracking-wider font-semibold">
              Account
            </p>
          </div>
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg border border-white/10 bg-white/5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime/15 text-lime">
              <User className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {admin.name}
              </p>
              <p className="text-xs text-on-dark-muted/60 truncate">
                {admin.email}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold",
                admin.isSuperAdmin
                  ? "bg-accent/10 text-lime border border-accent/20"
                  : "bg-white/10 text-on-dark-muted border border-white/10",
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              {admin.isSuperAdmin ? "Super Admin" : "Sub-Admin"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ChevronIcon({ className }: { className?: string }) {
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
