"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Mail, Phone, MapPin, GraduationCap, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type EnrollmentOpenShape = {
  id: string;
  name: string;
  slug: string;
  fee: number;
  currency: string;
  isFree: boolean;
  deliveryMethod: string;
  capacity: number;
  enrollmentClosesAt: string | null;
};

type InitialValues = {
  fullName?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  country?: string;
  district?: string;
  address?: string;
  dateOfBirth?: string | null;
  gender?: string;
  highestQualification?: string;
  institution?: string;
  occupation?: string;
  [key: string]: unknown;
};

interface EnrollSectionProps {
  course: EnrollmentOpenShape;
  enrollmentOpen: boolean;
  availableSlots: number | null;
  initialValues?: InitialValues;
}

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"] as const;
const QUALIFICATIONS = [
  "No formal qualification",
  "High school / WASSCE",
  "NVQ / City & Guilds",
  "OND / ND",
  "HND",
  "Bachelor’s degree",
  "Master’s degree",
  "Doctorate / PhD",
  "Other",
] as const;

const OCCUPATIONS = [
  "Not employed",
  "Student",
  "Self-employed",
  "Employed (private)",
  "Employed (public)",
  "Retired",
  "Other",
] as const;

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency,
  }).format(value);
}

export function EnrollSection({
  course,
  enrollmentOpen,
  availableSlots,
  initialValues,
}: EnrollSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ reference: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [values, setValues] = useState<Record<string, string>>({
    fullName: String(initialValues?.fullName ?? ""),
    email: String(initialValues?.email ?? ""),
    phone: String(initialValues?.phone ?? ""),
    whatsappNumber: String(initialValues?.whatsappNumber ?? ""),
    country: String(initialValues?.country ?? ""),
    district: String(initialValues?.district ?? ""),
    address: String(initialValues?.address ?? ""),
    dateOfBirth: String(initialValues?.dateOfBirth ?? ""),
    gender: String(initialValues?.gender ?? ""),
    highestQualification: String(initialValues?.highestQualification ?? ""),
    institution: String(initialValues?.institution ?? ""),
    occupation: String(initialValues?.occupation ?? ""),
    relevantExperience: "",
    deliveryPreference: course.deliveryMethod,
    whyJoin: "",
    relevantSkills: "",
    additionalInformation: "",
    consent: "",
  });

  useEffect(() => {
    if (success) {
      setShowForm(false);
    }
  }, [success]);

  function setField(field: string, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setError(null);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    const v = values;

    if (!v.fullName.trim()) next.fullName = "Full name is required.";
    if (!v.email.trim()) next.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) next.email = "Please enter a valid email address.";
    if (!v.phone.trim()) next.phone = "Phone number is required.";
    if (!v.address.trim()) next.address = "Residential address is required.";
    if (!v.dateOfBirth) next.dateOfBirth = "Date of birth is required.";
    if (!v.gender) next.gender = "Please select your gender.";
    if (!v.country.trim()) next.country = "Country is required.";
    if (!v.district.trim()) next.district = "District is required.";
    if (!v.highestQualification) next.highestQualification = "Please select your highest qualification.";
    if (!v.institution.trim()) next.institution = "School or institution is required.";
    if (!v.occupation) next.occupation = "Please select your occupation.";
    if (!v.deliveryPreference) next.deliveryPreference = "Please select a delivery preference.";
    if (!v.whyJoin.trim()) next.whyJoin = "Please tell us why you want to join this course.";

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    const payload = {
      courseSlug: course.slug,
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      whatsappNumber: values.whatsappNumber.trim(),
      country: values.country.trim(),
      district: values.district.trim(),
      address: values.address.trim(),
      dateOfBirth: values.dateOfBirth || null,
      gender: values.gender,
      highestQualification: values.highestQualification,
      institution: values.institution.trim(),
      occupation: values.occupation,
      relevantExperience: values.relevantExperience.trim(),
      deliveryPreference: values.deliveryPreference,
      whyJoin: values.whyJoin.trim(),
      relevantSkills: values.relevantSkills.trim(),
      additionalInformation: values.additionalInformation.trim(),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/course-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setFieldErrors(data.errors);
        throw new Error(data.message || "Application could not be submitted.");
      }
      setSuccess({ reference: data.reference });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const feeDisplay = course.isFree
    ? "Free"
    : formatCurrency(course.fee, course.currency);

  if (success) {
    return (
      <section className="border-b border-line bg-white py-16 lg:py-24">
        <div className="page-container">
          <div className="rounded-lg border border-success/40 bg-success-soft/20 p-8 md:p-12 text-center shadow-card">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-success mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-headline-md font-bold text-ink mb-3">
              Application submitted successfully
            </h2>
            <p className="text-body-sm leading-relaxed text-muted mb-6 max-w-xl mx-auto">
              Thank you for applying to Jallal Institute of Technology. Your
              application has been received and is awaiting administrative
              review.
            </p>
            <div className="inline-flex flex-col items-center gap-2 text-left">
              <span className="label-caps text-muted">
                Application reference number
              </span>
              <div className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2">
                <span className="font-mono font-bold text-ink">{success.reference}</span>
                <button
                  type="button"
                  className="text-label-sm text-accent hover:underline"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(success.reference)
                      .then(() => {})
                      .catch(() => {});
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="mt-5 text-body-sm text-muted max-w-xl mx-auto">
              Please keep this reference number for future communication. Our
              administrative team will review your application and notify you of
              the next steps.
            </p>
            <div className="mt-8">
              <Link
                href={`/courses/${course.slug}`}
                className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 label-caps text-ink transition-colors hover:bg-sunken"
              >
                <ArrowRight className="h-4 w-4 ml-2" />
                Return to course
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-line bg-white py-16 lg:py-24">
      <div className="page-container">
        {!showForm ? (
          <div className="rounded-lg border border-line bg-white p-6 md:p-10 shadow-card flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-headline-sm font-semibold text-ink">
                  Ready to enrol?
                </h3>
                <p className="text-body-sm text-muted">
                  Complete the application form below to reserve your place.
                </p>
              </div>
              <div className="flex items-center gap-2 text-label-sm text-muted">
                {course.capacity > 0 && availableSlots !== null && availableSlots <= 5 ? (
                  <span className="font-bold text-danger">
                    {availableSlots} slot{availableSlots === 1 ? "" : "s"} left
                  </span>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 text-body-sm">
              <div className="flex items-center gap-2 border-b border-line pb-2">
                <span className="text-muted">Fee</span>
                <span className="text-ink font-semibold">{feeDisplay}</span>
              </div>
              <div className="flex items-center justify-end gap-2 border-b border-line pb-2">
                <span className="text-muted">Delivery</span>
                <span className="text-ink">{course.deliveryMethod}</span>
              </div>
              <div className="flex items-center gap-2 border-b border-line pb-2">
                <span className="text-muted">Enrolment closes</span>
                <span className="text-ink font-semibold">
                  {new Date(course.enrollmentClosesAt ?? 0).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }) || "Not set"}
                </span>
              </div>
            </div>
            <div className="mt-6">
              {!enrollmentOpen ? (
                <div className="rounded-md border border-line bg-sunken p-4 text-center">
                  <span className="label-caps text-muted">
                    Enrolment is not currently open for this course.
                  </span>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="accent"
                  size="lg"
                  onClick={() => setShowForm(true)}
                  className="w-full"
                >
                  ENROLL NOW <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                className="inline-flex items-center gap-2 label-caps text-muted transition-colors hover:text-ink"
              >
                <ArrowRight className="h-4 w-4" rotate="-90" />
                Back to course details
              </button>
            </div>
            <div className="rounded-lg border border-line bg-white p-6 md:p-10 shadow-card">
              <h3 className="text-headline-sm font-semibold text-ink mb-2">
                Application form
              </h3>
              <p className="text-body-sm text-muted mb-6">
                Fields marked <span className="text-danger">*</span> are
                required.
              </p>
              {error && (
                <div className="rounded-lg border border-danger/40 bg-danger/5 p-4 text-body-sm text-danger mb-6">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name*" htmlFor="fullName" error={fieldErrors.fullName} required>
                    <Input
                      id="fullName"
                      value={values.fullName}
                      onChange={(e) => setField("fullName", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.fullName}
                    />
                  </Field>
                  <Field label="Email address*" htmlFor="email" error={fieldErrors.email} required>
                    <Input
                      id="email"
                      type="email"
                      value={values.email}
                      onChange={(e) => setField("email", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.email}
                    />
                  </Field>
                  <Field label="Phone number*" htmlFor="phone" error={fieldErrors.phone} required>
                    <Input
                      id="phone"
                      type="tel"
                      value={values.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.phone}
                    />
                  </Field>
                  <Field
                    label="WhatsApp number"
                    htmlFor="whatsappNumber"
                    error={fieldErrors.whatsappNumber}
                  >
                    <Input
                      id="whatsappNumber"
                      type="tel"
                      value={values.whatsappNumber}
                      onChange={(e) => setField("whatsappNumber", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.whatsappNumber}
                    />
                  </Field>
                  <Field label="Country*" htmlFor="country" error={fieldErrors.country} required>
                    <Input
                      id="country"
                      value={values.country}
                      onChange={(e) => setField("country", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.country}
                    />
                  </Field>
                  <Field label="District*" htmlFor="district" error={fieldErrors.district} required>
                    <Input
                      id="district"
                      value={values.district}
                      onChange={(e) => setField("district", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.district}
                    />
                  </Field>
                  <Field
                    label="Date of birth*"
                    htmlFor="dateOfBirth"
                    error={fieldErrors.dateOfBirth}
                    required
                  >
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={values.dateOfBirth}
                      onChange={(e) => setField("dateOfBirth", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.dateOfBirth}
                    />
                  </Field>
                  <Field label="Gender*" htmlFor="gender" error={fieldErrors.gender} required>
                    <Select
                      id="gender"
                      value={values.gender}
                      onChange={(e) => setField("gender", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.gender}
                    >
                      <option value="">Select gender</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="Highest qualification*"
                    htmlFor="highestQualification"
                    error={fieldErrors.highestQualification}
                    required
                  >
                    <Select
                      id="highestQualification"
                      value={values.highestQualification}
                      onChange={(e) => setField("highestQualification", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.highestQualification}
                    >
                      <option value="">Select qualification</option>
                      {QUALIFICATIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="School / institution*"
                    htmlFor="institution"
                    error={fieldErrors.institution}
                    required
                  >
                    <Input
                      id="institution"
                      value={values.institution}
                      onChange={(e) => setField("institution", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.institution}
                    />
                  </Field>
                  <Field
                    label="Current occupation*"
                    htmlFor="occupation"
                    error={fieldErrors.occupation}
                    required
                  >
                    <Select
                      id="occupation"
                      value={values.occupation}
                      onChange={(e) => setField("occupation", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.occupation}
                    >
                      <option value="">Select occupation</option>
                      {OCCUPATIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field
                  label="Residential address*"
                  htmlFor="address"
                  error={fieldErrors.address}
                  required
                >
                  <Input
                    id="address"
                    value={values.address}
                    onChange={(e) => setField("address", e.target.value)}
                    disabled={submitting}
                    invalid={!!fieldErrors.address}
                  />
                </Field>

                {!course.isFree && (
                  <Field
                    label="Delivery preference*"
                    htmlFor="deliveryPreference"
                    error={fieldErrors.deliveryPreference}
                    required
                    hint={course.deliveryMethod}
                  >
                    <Select
                      id="deliveryPreference"
                      value={values.deliveryPreference}
                      onChange={(e) => setField("deliveryPreference", e.target.value)}
                      disabled={submitting}
                      invalid={!!fieldErrors.deliveryPreference}
                    >
                      <option value="Online">Online</option>
                      <option value="Physical">Physical</option>
                      <option value="Hybrid">Hybrid</option>
                    </Select>
                  </Field>
                )}

                <Field
                  label="Why do you want to join this course?*"
                  htmlFor="whyJoin"
                  error={fieldErrors.whyJoin}
                  required
                  hint="Help us understand your motivation."
                >
                  <Textarea
                    id="whyJoin"
                    rows={4}
                    value={values.whyJoin}
                    onChange={(e) => setField("whyJoin", e.target.value)}
                    disabled={submitting}
                    invalid={!!fieldErrors.whyJoin}
                  />
                </Field>

                <Field
                  label="Relevant skills / previous experience"
                  htmlFor="relevantSkills"
                  error={fieldErrors.relevantSkills}
                  hint="Optional"
                >
                  <Textarea
                    id="relevantSkills"
                    rows={3}
                    value={values.relevantSkills}
                    onChange={(e) => setField("relevantSkills", e.target.value)}
                    disabled={submitting}
                    invalid={!!fieldErrors.relevantSkills}
                  />
                </Field>

                <Field
                  label="Additional information"
                  htmlFor="additionalInformation"
                  error={fieldErrors.additionalInformation}
                  hint="Optional"
                >
                  <Textarea
                    id="additionalInformation"
                    rows={3}
                    value={values.additionalInformation}
                    onChange={(e) => setField("additionalInformation", e.target.value)}
                    disabled={submitting}
                    invalid={!!fieldErrors.additionalInformation}
                  />
                </Field>

                <div className="flex items-start gap-3 pt-4">
                  <input
                    id="consent"
                    name="consent"
                    type="checkbox"
                    required
                    checked={values.consent === "true"}
                    onChange={() => setField("consent", values.consent === "true" ? "" : "true")}
                    disabled={submitting}
                    className="mt-1 h-4 w-4 shrink-0 accent-accent"
                  />
                  <label htmlFor="consent" className="text-body-sm text-muted">
                    I consent to Jallal Institute processing my application data.
                  </label>
                </div>

                <div className="pt-6">
                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      <>
                        Submit application <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
