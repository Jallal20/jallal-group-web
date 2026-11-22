import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/typography";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import { companies, getCompany } from "@/content/companies";

type Params = { slug: string };

export function generateStaticParams() {
  return companies.map((company) => ({ slug: company.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) return { title: "Company not found" };

  return {
    title: `${company.name} — ${company.category}`,
    description: company.tagline,
    alternates: { canonical: `/companies/${company.slug}` },
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const company = getCompany(slug);
  if (!company) notFound();

  const others = companies.filter((item) => item.slug !== company.slug);

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="page-container py-12 lg:py-16">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-label-sm text-muted"
          >
            <Link href="/" className="transition-colors hover:text-ink">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/our-companies"
              className="transition-colors hover:text-ink"
            >
              Our companies
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">{company.name}</span>
          </nav>

          <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col gap-5 lg:col-span-7">
              <ScrollReveal delay={0}>
                <Eyebrow>
                  Entity {company.index} · {company.category}
                </Eyebrow>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <h1 className="text-display-md font-bold tracking-tight text-ink sm:text-display-lg">
                  {company.name}
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <p className="max-w-2xl text-body-lg leading-relaxed text-muted">
                  {company.tagline}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-surface px-3 py-1.5 label-caps text-ink">
                    {company.established}
                  </span>
                  <Button href="/partnerships#inquiry" size="sm" className="btn-press">
                    Start a conversation
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-5">
              <ScrollReveal delay={0.1}>
                <div className="rounded-lg border border-line bg-surface p-2 shadow-card">
                  <div className="relative aspect-[16/10] overflow-hidden rounded">
                    <Image
                      src={company.image}
                      alt={company.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                  <span className="absolute bottom-3 left-3 rounded-sm bg-ink/80 px-2.5 py-1 label-caps text-white backdrop-blur">
                    {company.shortName} operations
                  </span>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface py-14 lg:py-20">
        <div className="page-container grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-4 lg:col-span-7 reveal-group">
            <ScrollReveal delay={0}>
              <h2 className="text-headline-lg font-bold tracking-tight text-ink">
                What {company.shortName} does
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <p className="text-body-lg leading-relaxed text-muted">
                {company.description}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-body-md leading-relaxed text-muted">
                {company.tagline} Engagements are delivered with the
                group&apos;s shared governance, security and delivery standards,
                and are supported by the group&apos;s technical, commercial and
                talent capabilities.
              </p>
            </ScrollReveal>
          </div>

          <aside className="rounded-lg border border-line bg-forest p-6 text-white lg:col-span-5">
            <span className="label-caps text-lime">Strategic mandate</span>
            <p className="mt-3 text-body-lg leading-relaxed text-on-dark">
              “{company.mandate}”
            </p>
            <div className="mt-6 flex gap-6 border-t border-white/10 pt-5">
              {company.metrics.map((metric) => (
                <div key={metric.label} className="flex flex-col">
                  <span className="text-headline-sm font-bold text-lime">
                    {metric.value}
                  </span>
                  <span className="label-caps text-on-dark-muted">
                    {metric.label}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="border-b border-line bg-white py-14 lg:py-20">
        <div className="page-container">
          <ScrollReveal delay={0}>
            <h2 className="text-headline-lg font-bold tracking-tight text-ink">
              Core capabilities
            </h2>
          </ScrollReveal>
          <div className="mt-8 reveal-group grid grid-cols-1 gap-6 md:grid-cols-2">
            {company.capabilities.map((capability) => (
              <article
                key={capability.title}
                className="hover-lift rounded-lg border border-line bg-surface p-6 hover:border-accent/40 transition-all"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-accent">
                  <Icon name={capability.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-title-md font-semibold text-ink">
                  {capability.title}
                </h3>
                <p className="mt-2 text-body-md leading-relaxed text-muted">
                  {capability.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sunken py-14 lg:py-20">
        <div className="page-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <ScrollReveal delay={0}>
              <h2 className="text-headline-lg font-bold tracking-tight text-ink">
                Other group companies
              </h2>
            </ScrollReveal>
            <Link
              href="/our-companies"
              className="group inline-flex items-center gap-2 text-body-sm font-semibold text-ink transition-colors hover:text-accent btn-press"
            >
              View all companies
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-8 reveal-group grid grid-cols-1 gap-6 md:grid-cols-3">
            {others.map((other) => (
              <Link
                key={other.slug}
                href={`/companies/${other.slug}`}
                className="group hover-lift rounded-lg border border-line bg-white p-6 shadow-card hover:border-accent/40 hover:shadow-raised"
              >
                <span className="label-caps text-muted">
                  Entity {other.index}
                </span>
                <h3 className="mt-3 text-title-md font-semibold text-ink group-hover:text-accent">
                  {other.name}
                </h3>
                <p className="mt-2 text-body-sm leading-relaxed text-muted">
                  {other.category}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
