import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/typography";
import { getProjectBySlug } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Project and Event Details",
};

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug).catch(() => null);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="label-caps text-accent">
          {project.companyName || "Jallal Group"}
        </span>
        <h1 className="text-headline-lg font-bold tracking-tight text-ink">{project.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-sunken px-2.5 py-1 text-label-sm font-medium text-muted">
            {project.category}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-label-sm font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {project.status}
          </span>
          <span className="label-caps text-muted">{project.type === "event" ? "Event" : "Project"}</span>
        </div>
      </div>

      {project.coverImageId ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-line bg-sunken">
          <img
            src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1"}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID}/files/${project.coverImageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
            alt={project.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <h2 className="text-headline-sm font-semibold text-ink mb-3">Overview</h2>
            <p className="text-body-sm leading-relaxed text-muted mb-4">{project.description}</p>

            {project.objectives ? (
              <div className="mb-6">
                <h3 className="label-caps text-accent mb-3">Objectives</h3>
                <ul className="list-disc list-inside space-y-2 text-body-sm text-ink/90">
                  {project.objectives.split("\n").filter(Boolean).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <h2 className="text-headline-sm font-semibold text-ink mb-4">Details</h2>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-body-sm">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Status</dt>
                <dd className="text-ink font-semibold">{project.status}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Progress</dt>
                <dd className="text-ink font-semibold">{project.progress}%</dd>
              </div>
              {project.eventDate ? (
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">{project.type === "event" ? "Event date" : "Target date"}</dt>
                  <dd className="text-ink">{formatDate(project.eventDate)}</dd>
                </div>
              ) : null}
              {project.endDate ? (
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">End date</dt>
                  <dd className="text-ink">{formatDate(project.endDate)}</dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Location</dt>
                <dd className="text-ink">{project.location || "Not specified"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                <dt className="text-muted">Participation</dt>
                <dd className="text-ink">{project.online ? "Online" : "In person"}</dd>
              </div>
              {project.companyName ? (
                <div className="flex items-center justify-between gap-3 border-b border-line pb-2">
                  <dt className="text-muted">Related company</dt>
                  <dd className="text-ink">{project.companyName}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>

        <div className="lg:col-span-5">
          <section className="rounded-lg border border-line bg-white p-6 shadow-card">
            <Eyebrow>{project.type === "event" ? "Registration" : "Engagement"}</Eyebrow>
            <h2 className="text-headline-sm font-semibold text-ink mt-3 mb-3">
              {project.type === "event" ? "Event registration" : "Get involved"}
            </h2>
            {project.registrationUrl ? (
              <p className="text-body-sm text-muted mb-4">
                Registration is handled through the official channel. Secure your place
                before the registration window closes.
              </p>
            ) : (
              <p className="text-body-sm text-muted mb-4">
                Registration is not currently open for this initiative. Reach out to the
                Jallal Group leadership team to express interest or request a briefing.
              </p>
            )}
            {project.registrationOpenAt ? (
              <p className="text-body-sm text-ink mb-4">
                Registration opens{" "}
                <strong>{formatDate(project.registrationOpenAt)}</strong>
                {project.registrationCloseAt ? (
                  <>
                    {" "}
                    and closes{" "}
                    <strong>{formatDate(project.registrationCloseAt)}</strong>
                  </>
                ) : null}
                .
              </p>
            ) : null}

            <div className="flex flex-col gap-3">
              {project.registrationUrl ? (
                <Button href={project.registrationUrl} variant="accent">
                  {project.type === "event" ? "Register now" : "Apply now"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button href="/partnerships" variant="secondary">
                  Enquire with our leadership
                </Button>
              )}
              <Button href="/projects" variant="outline">
                Back to all projects and events
              </Button>
            </div>
          </section>
        </div>
      </div>

      <CtaBand
        eyebrow="Jallal Group"
        title="Want to build with us?"
        description="From fintech rails to mobility grids, conferences and boot camps - the group is open to strategic co-development."
      />
    </div>
  );
}