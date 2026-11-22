import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { SectionHeading } from "@/components/ui/typography";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/layout/scroll-reveal";

const foundationPrinciples = [
  {
    icon: "globe" as const,
    title: "Vision and Long-Term Thinking",
    description:
      "We believe sustainable businesses are built through clear vision, strategic planning, responsible leadership, and consistent execution.",
  },
  {
    icon: "terminal" as const,
    title: "Technology and Innovation",
    description:
      "We use technology, digital infrastructure, and innovation to improve how individuals, businesses, and institutions operate, connect, and grow.",
  },
  {
    icon: "rocket" as const,
    title: "Entrepreneurship and Enterprise Development",
    description:
      "We identify opportunities, develop business ideas, establish ventures, and build organizations with the potential for sustainable growth.",
  },
  {
    icon: "badge-check" as const,
    title: "Disciplined Execution",
    description:
      "We believe ideas only create value when they are translated into practical solutions through accountability, strong management, and measurable results.",
  },
];

const subsidiaries = [
  {
    name: "Jallal Tech",
    description:
      "Technology development, software solutions, digital infrastructure, and IT services for public and private institutions.",
  },
  {
    name: "Jallal Institute of Technology",
    description:
      "Technology education, professional development, digital skills, and practical training for Sierra Leone's next engineering generation.",
  },
  {
    name: "Jallal Properties Group",
    description:
      "Real estate, property opportunities, and property-related services connecting individuals and enterprises with verified land and housing solutions.",
  },
  {
    name: "Elevate 360",
    description:
      "Business growth, technology adoption, digital transformation, and organizational development for growing enterprises.",
  },
];

const buildStages = [
  {
    step: "01",
    title: "Identify",
    description:
      "Understand real challenges, market gaps, and opportunities before committing resources.",
  },
  {
    step: "02",
    title: "Develop",
    description:
      "Build practical business models, technologies, and solutions designed for local operating conditions.",
  },
  {
    step: "03",
    title: "Execute",
    description:
      "Establish operational systems, teams, partnerships, and management structures that deliver results.",
  },
  {
    step: "04",
    title: "Scale",
    description:
      "Strengthen performance, expand reach, and pursue sustainable long-term growth across West Africa.",
  },
];

const coreValues = [
  {
    name: "Integrity",
    description:
      "Fiduciary transparency and disciplined governance in every entity, partnership, and transaction.",
  },
  {
    name: "Innovation",
    description:
      "Practical technology and new business models that solve real problems in emerging markets.",
  },
  {
    name: "Excellence",
    description:
      "World-class architecture and technical discipline applied to every subsidiary and initiative.",
  },
  {
    name: "Accountability",
    description:
      "Clear ownership, measurable results, and responsible leadership across the group.",
  },
  {
    name: "Collaboration",
    description:
      "Partnerships with entrepreneurs, institutions, and investors that create shared value.",
  },
  {
    name: "Sustainable Growth",
    description:
      "Long-term economic resilience built through local capacity and reinvested value.",
  },
];

export function AboutPreview() {
  return (
    <section className="border-b border-line bg-white py-16 lg:py-24 overflow-hidden">
      <div className="page-container relative">
        {/* Section Header */}
        <ScrollReveal delay={0}>
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              <SectionHeading
                eyebrow="Strategic foundation"
                title={
                  <>
                    Building Businesses. Developing Technology. Creating Lasting Impact.
                  </>
                }
                description={
                  <>
                    Jallal Group is a diversified business group established to build, develop,
                    and manage businesses, technology platforms, and strategic initiatives that
                    respond to real economic and social opportunities.
                  </>
                }
                actions={
                  <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                    <Link
                      href="/about"
                      className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-6 py-3 label-caps font-semibold text-ink transition-colors hover:bg-sunken hover:text-accent"
                    >
                      Discover Jallal Group
                      <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Button
                      href="/our-companies"
                      size="md"
                      variant="secondary"
                    >
                      Explore Our Companies
                    </Button>
                  </div>
                }
              />
            </div>
          </div>
        </ScrollReveal>

        {/* Our Foundation */}
        <ScrollReveal delay={0.1}>
          <section className="mt-16 border-t border-line pt-16">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="flex-none lg:w-72 lg:shrink-0">
                <h2 className="text-headline-md font-bold tracking-tight text-ink">
                  Our Foundation
                </h2>
                <p className="mt-4 text-body-md leading-relaxed text-muted">
                  Four principles define how we build, invest, and operate.
                </p>
              </div>
              <div className="flex-1 grid grid-cols-1 gap-6 md:grid-cols-2">
                {foundationPrinciples.map((principle) => (
                  <article
                    key={principle.title}
                    className="rounded-lg border border-line bg-white p-6 hover-lift hover:border-accent/40 transition-all"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface text-accent mb-4">
                      <Icon name={principle.icon} className="h-5 w-5" />
                    </div>
                    <h3 className="text-title-md font-semibold text-ink">
                      {principle.title}
                    </h3>
                    <p className="mt-2 text-body-sm leading-relaxed text-muted">
                      {principle.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Our Business Structure */}
        <ScrollReveal delay={0.2}>
          <section className="mt-20 border-t border-line pt-16 bg-surface">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="flex-none lg:w-72 lg:shrink-0">
                <h2 className="text-headline-md font-bold tracking-tight text-ink">
                  Our Business Structure
                </h2>
                <p className="mt-4 text-body-md leading-relaxed text-muted">
                  Jallal Group operates through distinct companies and initiatives,
                  each with its own area of focus.
                </p>
              </div>
              <div className="flex-1 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {subsidiaries.map((sub) => (
                  <article
                    key={sub.name}
                    className="rounded-lg border border-line bg-white p-6 hover-lift hover:border-accent/40 transition-all"
                  >
                    <h3 className="text-title-md font-semibold text-ink">
                      {sub.name}
                    </h3>
                    <p className="mt-2 text-body-sm leading-relaxed text-muted">
                      {sub.description}
                    </p>
                  </article>
                ))}
              </div>
              <div className="flex-none lg:w-72 lg:shrink-0 mt-8 lg:mt-0">
                <p className="text-body-md leading-relaxed text-muted">
                  The group structure allows each company to focus on its own market
                  while benefiting from shared strategic direction and organizational
                  leadership.
                </p>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* From Ideas to Sustainable Enterprises */}
        <ScrollReveal delay={0.3}>
          <section className="mt-20 border-t border-line pt-16">
            <div className="flex flex-col lg:flex-row lg:items-center gap-12">
              <div className="flex-1">
                <h2 className="text-headline-md font-bold tracking-tight text-ink">
                  From Ideas to Sustainable Enterprises
                </h2>
                <p className="mt-4 text-body-md leading-relaxed text-muted">
                  Our approach moves deliberately from insight to execution, ensuring
                  every venture is built on a viable foundation.
                </p>
              </div>
              <div className="flex-1 grid grid-cols-1 gap-6">
                {buildStages.map((stage) => (
                  <article
                    key={stage.step}
                    className="flex items-start gap-4 rounded-lg border border-line bg-white p-6 hover-lift hover:border-accent/40 transition-all group"
                  >
                    <span className="flex shrink-0 h-10 w-10 items-center justify-center rounded-md bg-forest text-white font-mono font-bold text-sm">
                      {stage.step}
                    </span>
                    <div>
                      <h3 className="text-title-md font-semibold text-ink">
                        {stage.title}
                      </h3>
                      <p className="mt-1 text-body-sm leading-relaxed text-muted">
                        {stage.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Our Vision for Sierra Leone and Africa */}
        <ScrollReveal delay={0.4}>
          <section className="mt-20 border-t border-line pt-16 bg-forest text-white">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 lg:p-12">
              <span className="label-caps inline-flex items-center gap-3 text-lime">
                <span aria-hidden="true" className="h-px w-8 bg-lime" />
                Strategic Outlook
              </span>
              <h2 className="mt-4 max-w-3xl text-headline-lg font-bold tracking-tight text-white lg:text-headline-md">
                Our Vision for Sierra Leone and Africa
              </h2>
              <p className="mt-5 max-w-2xl text-body-lg leading-relaxed text-on-dark-muted">
                Jallal Group is being developed from Bo, Sierra Leone with an
                ambition to participate in Africa's economic transformation. Our
                objective is to build competitive African businesses, support
                technology adoption, develop practical digital skills, and create
                opportunities for entrepreneurs and institutions across the region.
                We are investing in innovation and enterprise development, and
                establishing partnerships that support sustainable economic growth.
                These are strategic commitments we are working toward — not claims
                of achievements already made.
              </p>
            </div>
          </section>
        </ScrollReveal>

        {/* Core Values */}
        <ScrollReveal delay={0.5}>
          <section className="mt-20 border-t border-line pt-16 pb-16">
            <div className="grid grid-cols-1 gap-8 lg:flex-row lg:items-start">
              <div className="flex-none lg:w-72 lg:shrink-0">
                <h2 className="text-headline-md font-bold tracking-tight text-ink">
                  Our Core Values
                </h2>
                <p className="mt-4 text-body-md leading-relaxed text-muted">
                  Shared operating values applied equally across our subsidiaries,
                  ventures, and partnerships.
                </p>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {coreValues.map((value) => (
                  <article
                    key={value.name}
                    className="rounded-lg border border-line bg-white p-6 hover-lift hover:border-accent/40 transition-all"
                  >
                    <h3 className="text-title-md font-semibold text-ink">
                      {value.name}
                    </h3>
                    <p className="mt-2 text-body-sm leading-relaxed text-muted">
                      {value.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Call to Action Band */}
        <ScrollReveal delay={0.6}>
          <section className="mt-20 rounded-lg border border-line bg-surface p-8 lg:p-12">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-center">
              <div className="text-center sm:text-left">
                <span className="label-caps text-accent">
                  Ready to work together?
                </span>
                <h3 className="mt-2 text-headline-md font-bold tracking-tight text-ink sm:text-headline-lg">
                  Build the next chapter with Jallal Group.
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-6 py-3 label-caps font-semibold text-ink transition-colors hover:bg-sunken hover:text-accent"
                >
                  Discover Jallal Group
                  <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-1" />
                </Link>
                <Button href="/our-companies" size="md" variant="secondary">
                  Explore Our Companies
                </Button>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </section>
  );
}
