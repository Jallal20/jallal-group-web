"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Failure = { field?: string; message: string } | null;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [failure, setFailure] = useState<Failure>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFailure(null);

    if (!email.trim() || !password) {
      setFailure({ field: "both", message: "Enter your email and password." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const payload: { ok?: boolean; message?: string } = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !payload.ok) {
        setFailure({
          message: payload.message ?? "Sign-in failed. Please try again.",
        });
        setSubmitting(false);
        return;
      }

      const next = searchParams.get("next");
      const destination =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/admin";

      router.replace(destination);
      router.refresh();
    } catch {
      setFailure({
        message: "Network error. Please check your connection and try again.",
      });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="label-caps text-muted">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@jallalgroup.com"
          className="h-11 w-full rounded-md border border-line bg-white px-3.5 text-body-md text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="label-caps text-muted">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="h-11 w-full rounded-md border border-line bg-white pl-3.5 pr-11 text-body-md text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted transition-colors hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {failure ? (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-body-sm text-danger"
        >
          {failure.message}
        </div>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
