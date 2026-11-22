import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { SectionHeading } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { listCourses } from "@/lib/courses";
import EnrollmentForm from "./enrollment-form";
import type { Course } from "@/lib/types";

export const metadata: Metadata = {
  title: "Courses — Jallal Institute of Technology",
  description:
    "Technical training and digital skills development courses from Jallal Institute of Technology. Software engineering, cybersecurity, data science and more.",
  alternates: { canonical: "/courses" },
};

async function getPublicCourses(): Promise<Course[]> {
  try {
    const result = await listCourses({ published: true, limit: 100 });
    return result.items;
  } catch {
    return [];
  }
}

export default async function CoursesPage() {
  const courses = await getPublicCourses();

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div className="page-container relative py-14 lg:py-24">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col items-start gap-6 lg:col-span-7">
              <ScrollReveal delay={0}>
                <div className="inline-flex items-center gap-2 rounded-md bg-surface px-3 py-1.5">
                  <GraduationCap className="h-4 w-4 text-accent" />
                  <span className="label-caps text-ink">
                    Technical Education · Jallal Institute of Technology
                  </span>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <h1 className="max-w-3xl text-display-md font-bold tracking-tight text-ink sm:text-display-lg lg:text-display-xl">
                  Build in-demand technical skills.
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <p className="max-w-xl text-body-lg leading-relaxed text-muted">
                  Jallal Institute of Technology prepares ambitious youth and
                  transitioning professionals for the global digital economy
                  through rigorous technical bootcamps, certified engineering
                  curricula and corporate apprenticeships.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.3}>
                <div className="flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row">
                  <Button href="/partnerships#inquiry" size="lg" className="btn-press">
                    Request course information
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            <div className="relative lg:col-span-5">
              <ScrollReveal delay={0.1}>
                <div className="rounded-lg border border-line bg-surface p-2 shadow-raised">
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded">
                    <span className="absolute inset-0 flex items-center justify-center text-body-md text-muted">
                      Course catalogue — dynamic content from Appwrite
                    </span>
                  </div>
                  <div className="absolute inset-x-3 bottom-3 rounded-md border border-white/10 bg-white/95 p-4 shadow-card backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-forest">
                          <span className="h-2 w-2 rounded-full bg-lime" />
                        </span>
                        <span className="label-caps text-ink">
                          Certified training
                        </span>
                      </span>
                    </div>
                    <p className="mt-2 text-body-sm leading-relaxed text-muted">
                      Courses are managed through the admin dashboard and
                      published automatically.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {courses.length > 0 ? (
        <section className="border-b border-line bg-surface py-16 lg:py-24">
          <div className="page-container">
            <SectionHeading
              eyebrow="Available courses"
              title="Current course catalogue."
              description="Browse our technical training programmes. Enrolment is managed through the Jallal Institute of Technology admissions team."
            />
            <div className="mt-10 reveal-group grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="hover-lift rounded-lg border border-line bg-white p-6 shadow-card hover:border-accent/40 hover:shadow-raised"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="label-caps text-muted">{course.category}</span>
                      <span className="font-mono text-xs font-bold text-ink">
                        {course.code}
                      </span>
                    </div>
                    <Link
                      href={`/courses/${course.slug || course.code}`}
                      className="text-headline-sm font-semibold text-ink underline-offset-4 transition-colors hover:text-accent hover:underline"
                    >
                      {course.name}
                    </Link>
                    <p className="text-body-sm leading-relaxed text-muted">
                      {course.description}
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-2 text-label-sm text-muted">
                      <div className="flex flex-col gap-0.5">
                        <dt>Duration</dt>
                        <dd className="text-ink">{course.duration}</dd>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <dt>Fee</dt>
                        <dd className="text-ink">{course.fee}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        const el = document.getElementById("enrolment");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      Apply now
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <EnrollmentForm courses={courses} />
    </>
  );
}
