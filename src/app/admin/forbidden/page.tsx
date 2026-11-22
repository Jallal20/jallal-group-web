import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Forbidden",
  robots: { index: false, follow: false },
};

export default function ForbiddenPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-surface px-4 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-line bg-white p-8 shadow-card text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning mx-auto mb-4">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-headline-md font-bold tracking-tight text-ink">
            Not authorised
          </h1>
          <p className="mt-3 text-body-lg leading-relaxed text-muted">
            Your account does not have permission to access this module.
            Please contact the Super Administrator if you believe this is an
            error.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button href="/admin">Return to dashboard</Button>
            <Button
              href="/"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Back to site
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
