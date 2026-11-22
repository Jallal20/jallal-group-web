import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Eyebrow, SectionHeading } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { companies } from "@/content/companies";

export const metadata: Metadata = {
  title: "Our Companies — Jallal Group Subsidiaries",
  description:
    "Jallal Tech, Jallal Institute of Technology, Jallal Properties Group and Elevate 360 — the four operating subsidiaries of Jallal Group in Sierra Leone.",
  alternates: { canonical: "/companies" },
};

const divisions = [
  {
    code: "Div 01 / Infrastructure",
    title: "Digital engineering & cloud infrastructure",
    entity: "Jallal Tech",
    href: "/companies/jallal-tech",
  },
  {
    code: "Div 02 / Modernisation",
    title: "Operational transformation & SME scaling",
    entity: "Elevate 360",
    href: "/companies/elevate-360",
  },
  {
    code: "Div 03 / Human capital",
    title: "Technical workforce development",
    entity: "JIT Academy",
    href: "/companies/jallal-institute-of-technology",
  },
  {
    code: "Div 04 / Real estate",
    title: "Property & commercial asset solutions",
    entity: "Jallal Properties",
    href: "/companies/jallal-properties-group",
  },
];

const loops = [
  {
    tag: "Talent → production",
    title: "JIT → Jallal Tech engine",
    description:
      "The Jallal Institute of Technology trains high-performing engineering cohorts; Jallal Tech recruits directly from them, removing foreign recruitment bottlenecks and sustaining proprietary product development.",
  },
  {
    tag: "Software → assets",
    title: "Jallal Tech → property digitalisation",
    description:
      "Jallal Tech engineers land-registry verification, digital leasing and escrow systems used exclusively by Jallal Properties Group to deliver transparent asset transactions.",
  },
  {
    tag: "Growth → scale",
    title: "Elevate 360 → group modernisation",
    description:
      "Elevate 360 acts as the group's commercial rollout practice, standardising workflows, marketing operations and customer acquisition across every group arm.",
  },
];

export default function CompaniesPage() {
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
            <span className="text-ink">Our companies</span>
          </nav>

          <div className="mt-6 grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-7">
              <Eyebrow>Group portfolio & subsidiaries</Eyebrow>
              <h1 className="text-display-md font-bold tracking-tight text-ink sm:text-display-lg">
                Diverse enterprises.
                <br />
                <span className="text-accent">Unified excellence.</span>
              </h1>
            </div>
            <div className="flex flex-col gap-4 lg:col-span-5">
              <p className="text-body-lg leading-relaxed text-muted">
                Jallal Group operates four core commercial entities spanning
                software development, business transformation, digital education
                and real estate services. Each runs with dedicated leadership
                while drawing strength from shared group resources.
              </p>
              <div className="flex flex-wrap items-center gap-3 label-caps text-muted">
                <span>Sovereign mandate</span>
                <span aria-hidden="true">·</span>
                <span>Bo HQ</span>
                <span aria-hidden="true">·</span>
                <span>Multi-sector impact</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-forest py-12 text-white lg:py-16">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {divisions.map((division) => (
              <Link
                key={division.entity}
                href={division.href}
                className="group flex flex-col gap-3 rounded-md border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.08]"
              >
                <span className="label-caps text-lime">{division.code}</span>
                <h2 className="text-title-md font-semibold text-white">
                  {division.title}
                </h2>
                <span className="mt-auto flex items-center gap-1.5 pt-2 label-caps text-on-dark">
                  {division.entity}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-16 lg:py-24">
        <div className="page-container flex flex-col gap-8">
          {companies.map((company) => (
            <CompanyCard key={company.slug} company={company} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-sunken py-16 lg:py-24">
        <div className="page-container">
          <SectionHeading
            eyebrow="Integrated ecosystem"
            title="The conglomerate multiplier effect."
            description="The four subsidiaries do not operate as isolated entities. They feed a self-reinforcing loop of human capital, software intelligence, commercialisation and asset security."
          />
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {loops.map((loop) => (
              <article
                key={loop.title}
                className="flex flex-col gap-3 rounded-lg border border-line bg-white p-6 shadow-card"
              >
                <span className="label-caps text-accent">{loop.tag}</span>
                <h3 className="text-title-md font-semibold text-ink">
                  {loop.title}
                </h3>
                <p className="text-body-sm leading-relaxed text-muted">
                  {loop.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Capital allocation & strategic alliances"
        title="Explore partnership or investment opportunities with our subsidiaries."
        description="Development finance institutions, enterprises seeking digital systems and investors pursuing frontier-market exposure are all welcome to start a conversation."
      />
    </>
  );
}

function CompanyCard({ company }: { company: (typeof companies)[number] }) {
  return (
    <article
      id={company.slug}
      className="grid grid-cols-1 gap-8 rounded-lg border border-line bg-white p-6 shadow-card hover-lift transition-all hover:shadow-raised lg:grid-cols-12 lg:gap-10 lg:p-10"
    >
      <div className="flex flex-col gap-6 lg:col-span-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-md bg-surface px-2.5 py-1 label-caps text-accent">
              Entity {company.index}
            </span>
            <span className="label-caps text-muted">{company.established}</span>
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-headline-lg font-bold tracking-tight text-ink">
              {company.name}
            </h2>
            <p className="text-body-md font-medium text-accent">
              {company.category}
            </p>
          </div>

          <p className="text-body-md leading-relaxed text-muted">
            {company.description}
          </p>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-line">
          <Image
            src={company.image}
            alt={company.imageAlt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <span className="absolute bottom-3 left-3 rounded-sm bg-ink/80 px-2.5 py-1 label-caps text-white backdrop-blur">
            {company.shortName} operations
          </span>
        </div>

        <div className="rounded-md border border-line bg-surface p-4 mt-4">
          <span className="label-caps text-accent">Strategic mandate</span>
          <p className="mt-2 text-body-sm font-medium leading-relaxed text-ink">
            “{company.mandate}”
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-8 lg:col-span-7">
        <div>
          <h3 className="label-caps text-muted">Key capabilities</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {company.capabilities.map((capability) => (
              <div
                key={capability.title}
                className="rounded-md border border-line bg-surface p-4 hover:border-accent/40 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-accent mb-3">
                  <span className="text-accent">{capability.icon}</span>
                </div>
                <h4 className="mt-3 text-title-md font-semibold text-ink">
                  {capability.title}
                </h4>
                <p className="mt-1.5 text-body-sm leading-relaxed text-muted">
                  {capability.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-6">
            {company.metrics.map((metric, index) => (
              <div key={metric.label} className="flex items-center gap-6">
                {index > 0 ? (
                  <span aria-hidden="true" className="h-8 w-px bg-line" />
                ) : null}
                <div className="flex flex-col">
                  <span className="text-headline-sm font-bold text-ink">
                    {metric.value}
                  </span>
                  <span className="label-caps text-muted">{metric.label}</span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href={`/companies/${company.slug}`}
            className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 label-caps font-semibold text-ink transition-colors hover:bg-sunken hover:text-accent"
          >
            Explore company
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
