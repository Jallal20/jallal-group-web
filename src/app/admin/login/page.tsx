import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { getCurrentAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin sign-in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-line bg-white p-8 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-forest text-lime">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <span className="label-caps text-muted">Restricted area</span>
              <h1 className="text-headline-sm font-bold text-ink">
                Admin sign-in
              </h1>
            </div>
          </div>

          <p className="mt-4 text-body-sm leading-relaxed text-muted">
            Authorised Jallal Group personnel only. Sessions expire after 12
            hours and all actions are attributed to your account.
          </p>

          <div className="mt-6">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-body-sm">
            <Link
              href="/"
              className="text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Back to site
            </Link>
            <Link
              href="/admin/login"
              className="text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Trouble signing in?
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
