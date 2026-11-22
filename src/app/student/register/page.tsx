"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/field";
import { Mail, User, Phone, Lock, GraduationCap, MapPin } from "lucide-react";

export default function RegisterPage() {
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
      name: form.get("name"),
      studentId: form.get("studentId"),
      fullName: form.get("fullName"),
      phone: form.get("phone") ?? "",
      dateOfBirth: form.get("dateOfBirth") ?? null,
      gender: form.get("gender") ?? "",
      address: form.get("address") ?? "",
      institution: form.get("institution") ?? "",
      educationalLevel: form.get("educationalLevel") ?? "",
      courseOfStudy: form.get("courseOfStudy") ?? "",
    };

    try {
      const res = await fetch("/api/student/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed.");
      }
      window.location.href = "/student/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
            Create your student account
          </h1>
          <p className="text-body-md text-muted">
            Join the Jallal Group training portal to apply for boot camps,
            hackathons, and professional programs.
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
          <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
                  <User className="h-4 w-4 shrink-0" />
                  Full name
                </div>
                <Input id="fullName" placeholder="John Doe" required />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
                  <Mail className="h-4 w-4 shrink-0" />
                  Email address
                </div>
                <Input id="email" type="email" placeholder="you@example.com" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
                  <Phone className="h-4 w-4 shrink-0" />
                  Phone number
                </div>
                <Input id="phone" placeholder="+232 XX XXX XXXX" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  Student ID
                </div>
                <Input id="studentId" placeholder="e.g. JGT-2026-0001" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
                  <Lock className="h-4 w-4 shrink-0" />
                  Password
                </div>
                <Input id="password" type="password" placeholder="••••••••" required />
                <p className="text-xs text-muted">Minimum 8 characters</p>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-label-sm text-muted uppercase tracking-wider">
                  <MapPin className="h-4 w-4 shrink-0" />
                  Date of birth
                </div>
                <input id="dateOfBirth" type="date" className="block w-full rounded-md border border-line bg-white px-3 py-2 text-body-sm shadow-sm focus:border-accent focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Select defaultValue="" id="gender">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Prefer not to say</option>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="educationalLevel">Educational level</Label>
                <Select defaultValue="" id="educationalLevel">
                  <option value="">Select level</option>
                  <option value="high-school">High School</option>
                  <option value="diploma">Diploma</option>
                  <option value="bachelors">Bachelor's Degree</option>
                  <option value="masters">Master's Degree</option>
                  <option value="other">Other</option>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="institution">Institution / school</Label>
              <Input id="institution" placeholder="University or college name" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="courseOfStudy">Course of study</Label>
              <Input id="courseOfStudy" placeholder="e.g. Computer Science" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" rows={3} placeholder="Your address" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="mt-5 text-center text-body-sm text-muted">
            Already have an account?{" "}
            <Link href="/student/login" className="text-accent hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
