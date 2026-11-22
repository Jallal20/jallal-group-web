import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, GraduationCap, Play } from "lucide-react";
import { SectionHeading } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { EnrollSection } from "@/components/enrollment/enroll-section";
import { getCourseBySlug } from "@/lib/courses";
import { listCourseApplications } from "@/lib/course-applications";
import { getCurrentStudent } from "@/lib/student-auth";
import type { Course } from "@/lib/types";

export const metadata: Metadata = {
  title: "Course Details — Jallal Institute of Technology",
};

export const dynamic = "force-dynamic";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

async function getPublicCourse(slug: string) {
  try {
    return await getCourseBySlug(slug);
  } catch {
    return null;
  }
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getPublicCourse(slug);
  if (!course) notFound();

  // Count confirmed enrolments for available-slots display.
  let availableSlots: number | null = null;
  if (course.capacity > 0) {
    try {
      const result = await listCourseApplications({
        courseId: course.id,
        limit: 1000,
      });
      const confirmed = result.items.filter(
        (a) =>
          a.status === "enrollment-confirmed" ||
          a.status === "payment-verified" ||
          a.status === "payment-submitted" ||
          a.status === "approved",
      ).length;
      availableSlots = Math.max(course.capacity - confirmed, 0);
    } catch {
      availableSlots = null;
    }
  }

  const student = await getCurrentStudent().catch(() => null);

  const now = new Date();
  const enrollmentOpen =
    course.published &&
    (!course.enrollmentOpensAt || new Date(course.enrollmentOpensAt) <= now) &&
    (!course.enrollmentClosesAt || new Date(course.enrollmentClosesAt) >= now) &&
    (course.capacity === 0 || (availableSlots ?? 0) > 0);

  const initialValues = student
    ? {
        fullName: student.fullName,
        email: student.email,
        phone: student.phone,
        country: "",
        district: "",
        address: student.address,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        highestQualification: student.educationalLevel,
        institution: student.institution,
        occupation: "",
      }
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">
          Jallal Institute of Technology
        </span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">
          {course.name}
        </h1>
        <p className="text-body-md text-muted">
          {course.category} · {course.code}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="label-caps text-muted">{course.category}</span>
              {course.isFree ? (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-medium bg-success/10 text-success border border-success/20">
                  Free
                </span>
              ) : (
                <span className="font-mono text-xs font-bold text-ink">
                  {formatCurrency(course.fee, course.currency)}
                </span>
              )}
            </div>
            {course.imageId ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-line bg-sunken mb-6">
                <img
                  src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1"}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${course.imageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                  alt={course.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
            <h2 className="text-headline-sm font-semibold text-ink mb-3">
              About this course
            </h2>
            <p className="text-body-sm leading-relaxed text-muted mb-4">
              {course.description}
            </p>
            {course.objectives && (
              <div className="mb-6">
                <h3 className="label-caps text-accent mb-3">Learning objectives</h3>
                <ul className="list-disc list-inside space-y-2 text-body-sm text-ink/90">
                  {course.objectives.split("\n").filter(Boolean).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {course.curriculum && (
              <div className="mb-6">
                <h3 className="label-caps text-accent mb-3">Curriculum</h3>
                <div className="space-y-2 text-body-sm text-ink/90">
                  {course.curriculum.split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-forest">{i + 1}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {course.requirements && (
              <div className="mb-6">
                <h3 className="label-caps text-accent mb-3">Requirements</h3>
                <p className="text-body-sm text-ink/90 whitespace-pre-line">
                  {course.requirements}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <h2 className="text-headline-sm font-semibold text-ink mb-4">
              Course details
            </h2>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-body-sm">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Delivery method</dt>
                <dd className="text-ink">{course.deliveryMethod}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Duration</dt>
                <dd className="text-ink">{course.duration}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Fee</dt>
                <dd className="text-ink">
                  {course.isFree ? "Free" : formatCurrency(course.fee, course.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Currency</dt>
                <dd className="text-ink">{course.currency}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Location</dt>
                <dd className="text-ink">
                  {course.location || "Not specified"}
                </dd>
              </div>
              {course.startDate && (
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Start date</dt>
                  <dd className="text-ink">{formatDate(course.startDate)}</dd>
                </div>
              )}
              {course.endDate && (
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">End date</dt>
                  <dd className="text-ink">{formatDate(course.endDate)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Enrolment opens</dt>
                <dd className="text-ink">
                  {formatDate(course.enrollmentOpensAt)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Enrolment closes</dt>
                <dd className="text-ink">
                  {formatDate(course.enrollmentClosesAt)}
                </dd>
              </div>
              {course.capacity > 0 ? (
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Available slots</dt>
                  <dd className="text-ink font-semibold">
                    {availableSlots ?? course.capacity} of {course.capacity}
                  </dd>
                </div>
              ) : null}
              {course.instructorName && (
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Instructor</dt>
                  <dd className="text-ink">{course.instructorName}</dd>
                </div>
              )}
            </dl>
            {course.instructorBio && (
              <div className="mt-4 pt-4 border-t border-line">
                <h3 className="label-caps text-accent mb-2">Instructor</h3>
                <p className="text-body-sm text-ink/90 whitespace-pre-line">
                  {course.instructorBio}
                </p>
                {course.instructorEmail && (
                  <p className="text-body-sm text-muted mt-1">
                    <a
                      href={`mailto:${course.instructorEmail}`}
                      className="underline underline-offset-2 hover:text-accent"
                    >
                      {course.instructorEmail}
                    </a>
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-5">
          <EnrollSection
            course={course}
            enrollmentOpen={enrollmentOpen}
            availableSlots={availableSlots}
            initialValues={initialValues}
          />
        </div>
      </div>
    </div>
  );
}
