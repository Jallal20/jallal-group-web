import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { getCurrentAdmin, authorisedModules } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Jallal Group" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await getCurrentAdmin();

  // Unauthenticated visitors only ever see the login page (middleware also
  // guards this area); render without the shell in that case.
  if (!admin) return <>{children}</>;

  const moduleKeys = authorisedModules(admin);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="fixed inset-y-0 left-0 z-40 lg:relative">
        <AdminSidebar
          admin={{
            name: admin.name,
            email: admin.email,
            roles: admin.roles,
            isSuperAdmin: admin.isSuperAdmin,
          }}
          authorisedModuleKeys={moduleKeys}
        />
      </div>

      {/* Mobile overlay backdrop */}
      <div
        className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
        aria-hidden="true"
      />

      <div className="lg:pl-64 flex flex-col flex-1">
        <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-line bg-white/90 backdrop-blur-md lg:pl-64">
          <div className="page-container flex h-full items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                type="button"
                aria-label="Open navigation"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-sunken"
              >
                <span className="relative inline-flex h-5 w-5">
                  <span className="absolute left-0 inset-y-0 flex w-full flex-col items-center">
                    <span className="relative block h-0.5 w-full bg-current rounded-sm group-hover:bg-ink/60" />
                    <span className="relative block h-0.5 w-full bg-current rounded-sm" />
                    <span className="relative block h-0.5 w-full bg-current rounded-sm group-hover:bg-ink/60" />
                  </span>
                </span>
              </button>
            </div>

            <div className="flex flex-1 items-center justify-between gap-4">
              <div className="hidden lg:flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest text-white">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="flex flex-col leading-none">
                  <span className="label-caps mt-1 text-muted uppercase tracking-wider text-xs font-bold">
                    Jallal Group Admin
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="hidden sm:inline-flex h-9 items-center gap-2 rounded-md border border-line px-3 label-caps text-ink transition-colors hover:bg-sunken hover:text-accent"
                >
                  <ExternalLink className="h-4 w-4" />
                  View site
                </Link>
                <SignOutButton />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-16 lg:pt-0">
          <div className="page-container">{children}</div>
        </main>
      </div>
    </div>
  );
}
