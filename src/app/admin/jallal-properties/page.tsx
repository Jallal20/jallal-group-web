import Link from "next/link";
import { Folder, Building2, Rocket } from "lucide-react";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Jallal Properties Group" };
export const dynamic = "force-dynamic";

const MODULES = [
  {
    key: "properties",
    label: "Properties",
    href: "/admin/jallal-properties/properties",
    icon: Building2,
    description: "Manage property listings, lands, houses and commercial properties.",
  },
  {
    key: "projects",
    label: "Major Projects",
    href: "/admin/jallal-properties/projects",
    icon: Rocket,
    description: "Manage upcoming developments, housing estates and land schemes.",
  },
];

export default function JallalPropertiesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">Jallal Properties Group</span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          Property Management
        </h1>
        <p className="text-body-md text-muted">
          Manage real estate listings, major developments and property
          inquiries. Published listings appear on the public properties page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULES.map((module) => (
          <Link
            key={module.key}
            href={module.href}
            className="rounded-lg border border-line bg-white p-6 shadow-card hover-lift"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-forest text-white">
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
