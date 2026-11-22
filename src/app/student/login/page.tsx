"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget as HTMLFormElement);
    const body = {
      email: form.get("email"),
      password: form.get("password"),
    };

    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Invalid email or password.");
      }
      window.location.href = "/student/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="label-caps text-accent">Student Portal</span>
          <h1 className="text-headline-lg font-bold tracking-tight text-ink">
            Sign in to your account
          </h1>
          <p className="text-body-md text-muted">
            Access your applications, enrolled programs, and announcements.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger/5 p-5 text-body-sm text-danger">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-line bg-white shadow-card overflow-hidden">
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
                <Mail className="h-4 w-4 shrink-0" />
                Email address
              </div>
              <Input id="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
                <Lock className="h-4 w-4 shrink-0" />
                Password
              </div>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in…" : <><ArrowRight className="h-4 w-4 mr-2" /> Sign in</>}
            </Button>
          </form>
          <p className="mt-5 text-center text-body-sm text-muted">
            Don't have an account?{" "}
            <Link href="/student/register" className="text-accent hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
