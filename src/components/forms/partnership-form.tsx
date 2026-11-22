"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { partnershipTypeOptions } from "@/content/ventures";
import { site } from "@/content/site";

type FieldName =
  | "fullName"
  | "organization"
  | "email"
  | "phone"
  | "partnershipType"
  | "message"
  | "consent";

type Errors = Partial<Record<FieldName, string>>;

const initialValues = {
  fullName: "",
  organization: "",
  email: "",
  phone: "",
  partnershipType: "",
  message: "",
  website: "",
};

function validate(values: typeof initialValues, consent: boolean): Errors {
  const errors: Errors = {};

  if (values.fullName.trim().length < 2) {
    errors.fullName = "Please enter your full name.";
  }
  if (values.organization.trim().length < 2) {
    errors.organization = "Please enter your organisation.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (values.phone.trim().length < 5) {
    errors.phone = "Please enter a phone number.";
  }
  if (!values.partnershipType) {
    errors.partnershipType = "Please choose a partnership type.";
  }
  if (values.message.trim().length < 20) {
    errors.message = "Please provide at least 20 characters of context.";
  }
  if (values.message.trim().length > 4000) {
    errors.message = "Message must be 4000 characters or fewer.";
  }
  if (!consent) {
    errors.consent = "Please confirm this inquiry is authorised.";
  }

  return errors;
}

export function PartnershipForm() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [fallbackEmail, setFallbackEmail] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  function update(name: keyof typeof initialValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setServerError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === "submitting") return;

    const clientErrors = validate(values, consent);
    setErrors(clientErrors);

    if (Object.keys(clientErrors).length > 0) {
      const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
      firstInvalid?.focus();
      return;
    }

    setStatus("submitting");
    setServerError(null);
    setFallbackEmail(null);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          organization: values.organization,
          email: values.email,
          phone: values.phone,
          partnershipType: values.partnershipType,
          message: values.message,
          website: values.website,
          source: "partnerships-page",
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        email?: string;
        reference?: string;
        errors?: Record<string, string | undefined>;
      };

      if (response.ok && payload.ok) {
        setReference(payload.reference ?? null);
        setStatus("success");
        setValues(initialValues);
        setConsent(false);
        router.refresh();
        return;
      }

      if (payload.errors) {
        setErrors((current) => ({ ...current, ...payload.errors }));
      }

      setServerError(
        payload.message ?? "Something went wrong. Please try again.",
      );
      setFallbackEmail(payload.email ?? site.email);
      setStatus("idle");
    } catch {
      setServerError(
        "We could not reach the inquiry service. Check your connection and try again, or email us directly.",
      );
      setFallbackEmail(site.email);
      setStatus("idle");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex flex-col items-start gap-4 rounded-lg border border-accent/40 bg-success-soft/50 p-6"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-success">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <div className="flex flex-col gap-2">
          <h3 className="text-headline-sm font-semibold text-ink">
            Inquiry successfully registered
          </h3>
          <p className="text-body-md leading-relaxed text-muted">
            Your partnership dossier has been routed to the Jallal Group
            business development committee. An executive officer will respond via
            your verified email within two business days.
          </p>
          {reference ? (
            <p className="text-body-sm text-muted">
              Reference:{" "}
              <span className="font-mono font-semibold text-ink">
                {reference}
              </span>
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setStatus("idle");
            setServerError(null);
            setReference(null);
          }}
        >
          Submit another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5"
      aria-busy={status === "submitting"}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field
          label="Full name"
          htmlFor="fullName"
          required
          error={errors.fullName}
        >
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="e.g. Dr. Christian Sesay"
            value={values.fullName}
            invalid={Boolean(errors.fullName)}
            onChange={(event) => update("fullName", event.target.value)}
            disabled={status === "submitting"}
          />
        </Field>

        <Field
          label="Organisation"
          htmlFor="organization"
          required
          error={errors.organization}
        >
          <Input
            id="organization"
            name="organization"
            autoComplete="organization"
            placeholder="e.g. Pan-African Development Bank"
            value={values.organization}
            invalid={Boolean(errors.organization)}
            onChange={(event) => update("organization", event.target.value)}
            disabled={status === "submitting"}
          />
        </Field>

        <Field
          label="Work email"
          htmlFor="email"
          required
          error={errors.email}
        >
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="corporate.contact@entity.com"
            value={values.email}
            invalid={Boolean(errors.email)}
            onChange={(event) => update("email", event.target.value)}
            disabled={status === "submitting"}
          />
        </Field>

        <Field
          label="Phone number"
          htmlFor="phone"
          required
          error={errors.phone}
          hint="Include your country code."
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+232 (XX) XXX-XXX"
            value={values.phone}
            invalid={Boolean(errors.phone)}
            onChange={(event) => update("phone", event.target.value)}
            disabled={status === "submitting"}
          />
        </Field>
      </div>

      <Field
        label="Partnership classification"
        htmlFor="partnershipType"
        required
        error={errors.partnershipType}
      >
        <Select
          id="partnershipType"
          name="partnershipType"
          value={values.partnershipType}
          invalid={Boolean(errors.partnershipType)}
          onChange={(event) => update("partnershipType", event.target.value)}
          disabled={status === "submitting"}
        >
          <option value="">Select an engagement area…</option>
          {partnershipTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Collaboration proposal & scope"
        htmlFor="message"
        required
        error={errors.message}
        hint="Describe your organisation and the intended scope of cooperation."
      >
        <Textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Please provide a brief summary of your organisation and the proposed scope of collaboration…"
          value={values.message}
          invalid={Boolean(errors.message)}
          onChange={(event) => update("message", event.target.value)}
          disabled={status === "submitting"}
        />
      </Field>

      {/* Honeypot — hidden from humans, attractive to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => update("website", event.target.value)}
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked);
            setErrors((current) => ({ ...current, consent: undefined }));
          }}
          className="mt-1 h-4 w-4 shrink-0 accent-accent"
        />
        <label htmlFor="consent" className="text-body-sm text-muted">
          I confirm this inquiry represents an official institutional,
          commercial or accredited entity authorised to initiate exploratory
          dialogue.
          {errors.consent ? (
            <span role="alert" className="mt-1 block text-danger">
              {errors.consent}
            </span>
          ) : null}
        </label>
      </div>

      {serverError ? (
        <div
          role="alert"
          className="rounded-md border border-danger/30 bg-danger-soft/60 p-4 text-body-sm text-ink"
        >
          <p>{serverError}</p>
          {fallbackEmail ? (
            <a
              href={`mailto:${fallbackEmail}?subject=Partnership%20inquiry`}
              className="mt-1 inline-block font-semibold text-danger underline underline-offset-2"
            >
              Email {fallbackEmail}
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="submit"
          size="lg"
          disabled={status === "submitting"}
          className="w-full sm:w-auto"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              Submit partnership inquiry
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <p className="text-body-sm text-muted">
          We respond within two business days.
        </p>
      </div>
    </form>
  );
}
