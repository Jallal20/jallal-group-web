"use client";

import { useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { featuredVentures } from "@/content/ventures";
import { site } from "@/content/site";

export const VENTURE_INTEREST_TYPE = "venture-interest";

export function EarlyAccessDialog({
  label = "Register for venture updates",
  variant = "primary",
}: {
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState(featuredVentures[0]?.slug ?? "");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  function close() {
    setOpen(false);
    if (status === "success") {
      setStatus("idle");
      setName("");
      setEmail("");
      setInterest(featuredVentures[0]?.slug ?? "");
      setError(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setStatus("submitting");

    const ventureLabel =
      featuredVentures.find((venture) => venture.slug === interest)?.name ??
      "Comprehensive studio overview";

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          organization: "Venture studio inquiry",
          email: email.trim(),
          phone: "Not provided",
          partnershipType: VENTURE_INTEREST_TYPE,
          message: `Request for venture updates and sandbox access. Platform of interest: ${ventureLabel}.`,
          source: "digital-ventures",
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        email?: string;
      };

      if (response.ok && payload.ok) {
        setStatus("success");
        return;
      }

      setError(payload.message ?? "Something went wrong. Please try again.");
      setStatus("idle");
    } catch {
      setError("We could not reach the inquiry service. Please email us directly.");
      setStatus("idle");
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto"
      >
        {label}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="early-access-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-white p-6 shadow-overlay">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="label-caps text-accent">Early engagement</span>
                <h2
                  id="early-access-title"
                  className="mt-1 text-title-md font-semibold text-ink"
                >
                  Register for venture updates
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close dialog"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {status === "success" ? (
              <div role="status" className="mt-5 flex flex-col gap-3">
                <p className="text-body-md leading-relaxed text-muted">
                  Thank you. Your request has been catalogued. Our technical
                  relations team will reach out directly as milestones are
                  reached.
                </p>
                <Button type="button" variant="secondary" onClick={close}>
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
                <p className="text-body-sm leading-relaxed text-muted">
                  Receive developmental roadmaps, technical whitepapers and
                  developer sandbox credentials as platforms reach testing
                  milestones.
                </p>

                <Field label="Full name / title" htmlFor="ea-name" error={error ?? undefined}>
                  <Input
                    id="ea-name"
                    autoComplete="name"
                    placeholder="e.g. Alimamy Turay, Chief Technology Officer"
                    value={name}
                    invalid={Boolean(error && name.trim().length < 2)}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError(null);
                    }}
                    disabled={status === "submitting"}
                  />
                </Field>

                <Field label="Institutional email" htmlFor="ea-email">
                  <Input
                    id="ea-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@institution.sl"
                    value={email}
                    invalid={Boolean(
                      error && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email),
                    )}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError(null);
                    }}
                    disabled={status === "submitting"}
                  />
                </Field>

                <Field label="Platform of primary interest" htmlFor="ea-interest">
                  <Select
                    id="ea-interest"
                    value={interest}
                    onChange={(event) => setInterest(event.target.value)}
                    disabled={status === "submitting"}
                  >
                    {featuredVentures.map((venture) => (
                      <option key={venture.slug} value={venture.slug}>
                        {venture.name}
                      </option>
                    ))}
                    <option value="all">Comprehensive studio overview</option>
                  </Select>
                </Field>

                {error ? (
                  <p role="alert" className="text-body-sm text-danger">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full"
                >
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit registry request"
                  )}
                </Button>

                <p className="text-body-sm text-muted">
                  Or email{" "}
                  <a
                    href={`mailto:${site.email}`}
                    className="font-semibold text-ink underline underline-offset-2"
                  >
                    {site.email}
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
