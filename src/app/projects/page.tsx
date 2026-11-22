import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/typography";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { listProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects & Upcoming Events",
  description:
    "Explore Jallal Group projects, product launches, events, conferences, workshops and training programs. Discover what we are building and what is coming next.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const { items } = await listProjects({ published: true, limit: 50 });
  const visible = [...items].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <>
      <section className="border-b border-line bg-sunken py-16 lg:py-24">
        <div className="page-container">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <ScrollReveal delay={0} className="w-full">
              <SectionHeading
                eyebrow="Portfolio & calendar"
                title="Projects and upcoming events."
                description="Every initiative, launch and gathering published by the Jallal Group from venture studios and product builds to conferences, workshops and boot camps."
                actions={
                  <Button href="/" variant="secondary">
                    Back to homepage
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                }
              />
            </ScrollReveal>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <article
                key={item.id}
                className="hover-lift flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card hover:border-accent/40 hover:shadow-raised"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-forest">
                  {item.coverImageId ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? ""}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID ?? ""}/files/${item.coverImageId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? ""}`}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-label-caps text-lime">JALLAL GROUP</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="label-caps text-accent">{item.category}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-2.5 py-1 text-label-sm font-medium text-muted">
                      <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-headline-md font-bold tracking-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="text-body-md leading-relaxed text-muted">{item.description}</p>

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
        </div>
      </section>

      <CtaBand
        eyebrow="Jallal Group"
        title="Have a project or event in mind?"
        description="The group is always exploring new ventures and partnerships. Tell us about your initiative and we will explore it for the group."
      />
    </>
  );
}
