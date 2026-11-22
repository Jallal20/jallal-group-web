"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { Course } from "@/lib/types";

interface EnrollmentFormProps {
  courses: Course[];
}

export default function EnrollmentForm({ courses }: EnrollmentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage(null);
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const courseSelect = form.get("course") as string;
    const course = courses.find((c) => c.name === courseSelect) ?? courses[0];

    const payload = {
      courseId: course?.id ?? "",
      courseName: courseSelect,
      fullName: form.get("fullName") as string,
      email: form.get("email") as string,
      phone: form.get("phone") as string,
      whatsappNumber: form.get("whatsappNumber") as string,
      dateOfBirth: form.get("dateOfBirth") as string,
      gender: form.get("gender") as string,
      address: form.get("address") as string,
      educationBackground: form.get("educationBackground") as string,
      relevantExperience: form.get("relevantExperience") as string,
      additionalInformation: form.get("additionalInformation") as string,
    };

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Enrolment could not be recorded.");
      setSubmitMessage({
        kind: "success",
        text: `Your enrolment has been received (reference ${data.reference}). We will review your application and respond shortly.`,
      });
      (e.currentTarget as HTMLFormElement).reset();
    } catch (err) {
      setSubmitMessage({
        kind: "error",
        text: err instanceof Error ? err.message : "We could not record your enrolment right now.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-b border-line bg-white py-16 lg:py-24">
      <div className="page-container">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-headline-sm font-semibold text-ink mb-2">
              Enrolment Form
            </h3>
            <p className="text-body-sm text-muted mb-4">
              Select your course of interest and provide your details. Our
              admissions team will review your application and respond within
              five business days.
            </p>
          </div>
        </div>

        {submitMessage ? (
          <div
            className={cn(
              "rounded-md p-4 mb-4 text-body-sm",
              submitMessage.kind === "success"
                ? "bg-success-soft border border-success/20 text-success"
                : "bg-danger-soft border border-danger/20 text-danger",
            )}
          >
            {submitMessage.text}
          </div>
        ) : null}

        <div className="max-w-2xl">
          <div className="rounded-lg border border-line bg-white p-6 shadow-card">
            <form onSubmit={handleEnroll} id="enrolment" className="flex flex-col gap-3">
              <Input
                placeholder="Full name"
                name="fullName"
                className="w-full"
                required
              />
              <Input
                type="email"
                placeholder="Email address"
                name="email"
                className="w-full"
                required
              />
              <Input
                type="tel"
                placeholder="Phone number"
                name="phone"
                className="w-full"
                required
              />
              <Select name="course" className="w-full" required>
                <option value="">Select a course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>
              <Input type="tel" placeholder="WhatsApp number" name="whatsappNumber" className="w-full" />
              <Input type="date" placeholder="Date of birth" name="dateOfBirth" className="w-full" />
              <Input placeholder="Gender" name="gender" className="w-full" />
              <Input placeholder="Address" name="address" className="w-full" />
              <Textarea
                placeholder="Tell us about your education background…"
                name="educationBackground"
                rows={4}
                className="w-full"
                required
              />
              <Textarea
                placeholder="Relevant experience (optional)"
                name="relevantExperience"
                rows={3}
                className="w-full"
              />
              <Textarea
                placeholder="Additional information (optional)"
                name="additionalInformation"
                rows={3}
                className="w-full"
              />
              <div className="flex items-start gap-3 mt-2">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0 accent-accent"
                  required
                />
                <label htmlFor="consent" className="text-body-sm text-muted">
                  I consent to Jallal Institute processing my enrolment data.
                </label>
              </div>
              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full mt-4"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit enrolment"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
