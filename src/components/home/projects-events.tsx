import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/typography";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { Icon } from "@/components/icon";
import { mediaUrl } from "@/lib/storage-urls";
import type { ShowcaseItem } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  Upcoming: "bg-sunken text-muted",
  Planning: "bg-sunken text-muted",
  "In Development": "bg-success-soft text-success",
  Ongoing: "bg-success-soft text-success",
  "Registration Open": "bg-accent-soft text-accent",
  "Registration Closed": "bg-sunken text-muted",
  Completed: "bg-sunken text-muted",
  Postponed: "bg-sunken text-muted",
  Cancelled: "bg-danger-soft text-danger",
};

const STATUS_DOTS: Record<string, string> = {
  Upcoming: "bg-line-strong",
  Planning: "bg-line-strong",
  "In Development": "bg-accent",
  Ongoing: "bg-accent",
  "Registration Open": "bg-accent",
  "Registration Closed": "bg-line-strong",
  Completed: "bg-line-strong",
  Postponed: "bg-line-strong",
  Cancelled: "bg-danger",
};

export function ProjectsEvents({
  items,
  heading = "What We're Building. What's Coming Next.",
  description = "Discover the projects, initiatives, events and opportunities shaping the future of Jallal Group.",
  ctaHref = "/projects",
  ctaLabel = "View all projects & events",
}: {
  items: ShowcaseItem[];
  heading?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const visible = items.filter((item) => item.published).slice(0, 6);

  return (
    <section className="border-b border-line bg-white py-16 lg:py-24">
      <div className="page-container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <ScrollReveal delay={0} className="w-full">
            <SectionHeading
              eyebrow="What we're building"
              title={heading}
              description={description}
              tone="dark"
              actions={
                <Button href={ctaHref} variant="secondary">
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              }
            />
          </ScrollReveal>
        </div>

        {visible.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <article
                key={item.id}
                className="group hover-lift flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card hover:border-accent/40 hover:shadow-raised"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-forest">
                  {item.coverImageId ? (
                    <img
                      src={mediaUrl(item.coverImageId)}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon name="rocket" className="h-10 w-10 text-lime" />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="label-caps text-accent">{item.category}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm font-medium ${STATUS_STYLES[item.status] ?? "bg-sunken text-muted"}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[item.status] ?? "bg-line-strong"}`}
                      />
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-headline-md font-bold tracking-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="text-body-md leading-relaxed text-muted">{item.description}</p>

                  <dl className="mt-2 grid grid-cols-1 gap-2 border-t border-line pt-4 sm:grid-cols-2">
                    {item.eventDate ? (
                      <div className="flex flex-col gap-1">
                        <dt className="label-caps text-muted">
                          {item.type === "event" ? "Event date" : "Target date"}
                        </dt>
                        <dd className="text-body-sm font-medium text-ink">
                          {new Date(item.eventDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </dd>
                      </div>
                    ) : null}
                    {item.location ? (
                      <div className="flex flex-col gap-1">
                        <dt className="label-caps text-muted">Location</dt>
                        <dd className="text-body-sm font-medium text-ink">{item.location}</dd>
                      </div>
                    ) : null}
                    {item.registrationOpenAt ? (
                      <div className="flex flex-col gap-1">
                        <dt className="label-caps text-muted">Registration opens</dt>
                        <dd className="text-body-sm font-medium text-ink">
                          {new Date(item.registrationOpenAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-5">
                    <Link
                      href={`/projects/${item.slug}`}
                      className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-ink transition-colors hover:text-accent btn-press"
                    >
                      View details
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    {item.registrationUrl ? (
                      <Button href={item.registrationUrl} variant="accent" size="sm">
                        {item.type === "event" ? "Register" : "Apply"}
                      </Button>
                    ) : (
                      <Button href="/partnerships" variant="secondary" size="sm">
                        Enquire
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-lg border border-line bg-surface p-10 text-center">
            <Eyebrow>Coming soon</Eyebrow>
            <h3 className="mt-3 text-headline-md font-bold text-ink">
              Projects are being curated.
            </h3>
            <p className="mt-2 max-w-2xl text-body-md leading-relaxed text-muted">
              The Jallal Group is currently shaping new initiatives. Check back soon
              or engage with our leadership team through the partnerships desk.
            </p>
            <div className="mt-6">
              <Button href="/partnerships" variant="secondary">
                Engage with our leadership
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
