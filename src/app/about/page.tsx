import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Icon } from "@/components/icon";
import { SectionHeading, Eyebrow } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { companies } from "@/content/companies";
import { featuredVentures } from "@/content/ventures";

export const metadata: Metadata = {
  title: "About Jallal Group",
  description:
    "Learn about Jallal Group — a Bo-based business group building technology, education, real estate and digital ventures with institutional governance and long-term ambition across Sierra Leone and West Africa.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: "shield-check" as const,
    title: "Integrity",
    description:
      "Fiduciary transparency and disciplined governance in every entity, partnership and transaction.",
  },
  {
    icon: "terminal" as const,
    title: "Engineering rigour",
    description:
      "Solutions are architected for real operating conditions — low bandwidth, intermittent power, high stakes.",
  },
  {
    icon: "users" as const,
    title: "People first",
    description:
      "We invest in local technical talent so growth compounds inside the communities we serve.",
  },
  {
    icon: "globe" as const,
    title: "Long-term horizon",
    description:
      "We build for durable value and sovereign capability, not short-term extraction.",
  },
];

const focusAreas = [
  {
    title: "Technology",
    description:
      "Software development, enterprise IT, data infrastructure and digital solutions for public and private institutions.",
  },
  {
    title: "Business development",
    description:
      "Operational scaling, digital presence and commercial acceleration for growing African enterprises.",
  },
  {
    title: "Education",
    description:
      "Technical training and digital skills development that build the next generation of West African engineers.",
  },
  {
    title: "Real estate",
    description:
      "Property services, land diligence and asset development across Sierra Leone's high-growth corridors.",
  },
  {
    title: "Digital ventures",
    description:
      "Proprietary platforms in payments, mobility and property — incubated, prototyped and shipped in-house.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-white">
        <div
          aria-hidden="true"
          className="surface-grid pointer-events-none absolute inset-0 opacity-40"
        />
        <div className="page-container relative py-14 lg:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col gap-5 lg:col-span-7">
              <Eyebrow>About Jallal Group</Eyebrow>
              <h1 className="text-display-md font-bold tracking-tight text-ink sm:text-display-lg">
                A group built on vision, discipline and innovation.
              </h1>
              <p className="max-w-2xl text-body-lg leading-relaxed text-muted">
                Jallal Group is a diversified business group based in Bo,
                Sierra Leone. We build companies and platforms across technology,
                business development, education, real estate and digital ventures
                — each designed to create lasting value at home and across the
                region.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button href="/our-companies">
                  Our companies
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/partnerships#inquiry" variant="secondary">
                  Partner with us
                </Button>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-6 self-end lg:col-span-5 lg:grid-cols-2">
              {[
                { value: "2021", label: "Founded in Bo" },
                { value: "04", label: "Operating companies" },
                { value: "03", label: "Digital ventures" },
                { value: "1,200+", label: "Graduates trained" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-5"
                >
                  <dd className="order-1 text-headline-md font-bold text-ink">
                    {stat.value}
                  </dd>
                  <dt className="order-2 label-caps text-muted">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface py-16 lg:py-24">
        <div className="page-container">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-6">
              <div className="rounded-lg border border-line bg-white p-2 shadow-card">
                <div className="relative aspect-[16/10] overflow-hidden rounded">
                  <Image
                    src="/images/ventures-studio.jpg"
                    alt="Jallal Group product and engineering team reviewing system architecture"
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 lg:col-span-6">
              <Eyebrow>Our story</Eyebrow>
              <h2 className="text-display-md font-bold tracking-tight text-ink lg:text-display-lg">
                Grounded in Sierra Leone. Built for scale.
              </h2>
              <p className="text-body-lg leading-relaxed text-muted">
                Jallal Group began with a simple observation: the most durable
                businesses in emerging markets are the ones that solve structural
                problems with local insight and world-class execution. We started
                in software, and expanded deliberately — into education that feeds
                our engineering pipeline, growth services that commercialise
                products, property that anchors real assets, and ventures that
                modernise everyday systems.
              </p>
              <p className="text-body-md leading-relaxed text-muted">
                Today the group operates as a group structure with shared
                technology, governance and capital discipline. Each subsidiary
                runs with dedicated leadership and clear accountability, while
                drawing on the group&apos;s common infrastructure.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-forest py-16 text-white lg:py-24">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-7 lg:p-9">
              <span className="label-caps text-lime">Our vision</span>
              <h2 className="mt-3 text-headline-lg font-bold tracking-tight text-white">
                A sovereign, technology-driven economy for Sierra Leone and West
                Africa.
              </h2>
              <p className="mt-4 text-body-md leading-relaxed text-on-dark-muted">
                We envision an ecosystem where local talent builds the
                infrastructure its own society depends on — where payments,
                mobility, property and enterprise software are engineered here,
                governed properly, and scaled responsibly.
              </p>
            </article>

            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-7 lg:p-9">
              <span className="label-caps text-lime">Our mission</span>
              <h2 className="mt-3 text-headline-lg font-bold tracking-tight text-white">
                Build companies that outlast us and opportunities that outgrow us.
              </h2>
              <p className="mt-4 text-body-md leading-relaxed text-on-dark-muted">
                We establish and grow operating businesses with disciplined
                governance, invest in technical education, and incubate digital
                ventures that remove friction from everyday economic life —
                creating employment, capability and compounding value.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white py-16 lg:py-24">
        <div className="page-container">
          <SectionHeading
            eyebrow="Core values"
            title="The principles behind every decision."
            description="Shared operating values that apply equally to our subsidiaries, our ventures and our partnerships."
          />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <article
                key={value.title}
                className="rounded-lg border border-line bg-surface p-6 transition-colors hover:border-line-strong"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-accent">
                  <Icon name={value.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-title-md font-semibold text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 text-body-sm leading-relaxed text-muted">
                  {value.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-surface py-16 lg:py-24">
        <div className="page-container">
          <SectionHeading
            eyebrow="Focus areas"
            title="Where we operate."
            description="Five reinforcing areas of activity, coordinated through a single group structure."
          />
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2 lg:grid-cols-5">
            {focusAreas.map((area, index) => (
              <div key={area.title} className="flex flex-col bg-white p-6">
                <span className="label-caps text-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-title-md font-semibold text-ink">
                  {area.title}
                </h3>
                <p className="mt-2 text-body-sm leading-relaxed text-muted">
                  {area.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-line bg-white p-6">
              <span className="label-caps text-accent">Operating companies</span>
              <ul className="mt-4 flex flex-col gap-3">
                {companies.map((company) => (
                  <li key={company.slug}>
                      <a
                        href={`/companies/${company.slug}`}
                      className="flex items-center justify-between gap-4 border-b border-line pb-3 text-body-md font-medium text-ink transition-colors hover:text-accent"
                    >
                      {company.name}
                      <ArrowRight className="h-4 w-4 text-muted" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-line bg-white p-6">
              <span className="label-caps text-accent">Digital ventures</span>
              <ul className="mt-4 flex flex-col gap-3">
                {featuredVentures.map((venture) => (
                  <li key={venture.slug}>
                    <a
                      href={`/digital-ventures#${venture.slug}`}
                      className="flex items-center justify-between gap-4 border-b border-line pb-3 text-body-md font-medium text-ink transition-colors hover:text-accent"
                    >
                      {venture.name}
                      <span className="text-body-sm text-muted">
                        {venture.status}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        eyebrow="Work with us"
        title="Build the next chapter with Jallal Group."
        description="Whether you are an institution, an investor, an enterprise or a partner with regional ambition, we would like to hear from you."
      />
    </>
  );
}
