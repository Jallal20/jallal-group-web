import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin, hasPermission } from "@/lib/auth";
import { ShieldCheck, Building2, Users, Layers, Rocket, GraduationCap, Folder, MailOpen, Activity, Settings } from "lucide-react";

export const metadata: Metadata = { title: "Roles & Permissions" };
export const dynamic = "force-dynamic";

const ROLES = [
  {
    key: "admin",
    label: "Super Admin",
    description: "Full access to all modules and platform settings.",
    permissions: [
      "companies.manage", "properties.manage", "propertyProjects.manage",
      "courses.manage", "enrollments.manage", "elevateProjects.manage",
      "techProjects.manage", "auditLogs.view", "users.manage",
      "settings.manage", "content.manage",
    ],
  },
  {
    key: "jallal-tech-admin",
    label: "Jallal Tech Administrator",
    description: "Manages Jallal Tech content and projects.",
    permissions: ["techProjects.manage", "content.manage"],
  },
  {
    key: "jallal-institute-admin",
    label: "Jallal Institute Administrator",
    description: "Manages courses and enrollments.",
    permissions: ["courses.manage", "enrollments.manage"],
  },
  {
    key: "jallal-properties-admin",
    label: "Jallal Properties Administrator",
    description: "Manages properties and major projects.",
    permissions: ["properties.manage", "propertyProjects.manage"],
  },
  {
    key: "elevate-360-admin",
    label: "Elevate 360 Administrator",
    description: "Manages Elevate 360 projects.",
    permissions: ["elevateProjects.manage"],
  },
  {
    key: "content-editor",
    label: "Content Editor",
    description: "Manages website content and digital ventures.",
    permissions: ["content.manage"],
  },
] as const;

const ALL_PERMISSIONS = [
  { key: "companies.manage", label: "Companies - Manage" },
  { key: "properties.manage", label: "Properties - Manage" },
  { key: "propertyProjects.manage", label: "Property Projects - Manage" },
  { key: "courses.manage", label: "Courses - Manage" },
  { key: "enrollments.manage", label: "Enrollments - Manage" },
  { key: "elevateProjects.manage", label: "Elevate 360 Projects - Manage" },
  { key: "techProjects.manage", label: "Jallal Tech Projects - Manage" },
  { key: "auditLogs.view", label: "Audit Logs - View" },
  { key: "users.manage", label: "Users - Manage" },
  { key: "settings.manage", label: "Settings - Manage" },
  { key: "content.manage", label: "Content - Manage" },
] as const;

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Roles & Permissions</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Administrator Roles
        </h1>
        <p className="text-body-md text-muted">
          Define and review granular permissions for Sub-Admins.
        </p>
      </div>

      <div className="rounded-lg border border-line bg-white p-6 shadow-card">
        <h2 className="text-headline-sm font-semibold text-ink mb-4">Role Definitions</h2>
        <div className="grid grid-cols-1 gap-4">
          {ROLES.map((role) => (
            <div
              key={role.key}
              className="rounded-lg border border-line bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-title-md font-semibold text-ink">
                  {role.label}
                </span>
                <span className="label-caps text-accent">
                  {role.key}
                </span>
              </div>
              <p className="text-body-sm text-muted mb-3">
                {role.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-md border border-line/50 bg-surface px-2 py-1 text-label-xs text-ink"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/20" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        <h2 className="text-headline-sm font-semibold text-ink mb-4">All Permissions</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {ALL_PERMISSIONS.map((perm) => (
            <div key={perm.key} className="flex items-center gap-2 p-3 rounded-md border border-line bg-white">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-accent"
                disabled
              />
              <span className="text-body-sm text-ink">{perm.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-white p-6 shadow-card">
        <h2 className="text-headline-sm font-semibold text-ink mb-4">Security Rules</h2>
        <ul className="space-y-3 text-body-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            Sub-Admins cannot promote themselves or others to Super Admin.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            All permissions are enforced server-side on every protected route.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            Only the Super Admin can create and manage administrator accounts.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            Super Admin status cannot be assigned through the UI.
          </li>
        </ul>
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

