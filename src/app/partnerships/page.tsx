import type { Metadata } from "next";
import { Clock, Lock, Mail, MapPin, ShieldCheck } from "lucide-react";
import { PartnershipForm } from "@/components/forms/partnership-form";
import { Icon } from "@/components/icon";
import { Eyebrow, SectionHeading } from "@/components/ui/typography";
import { partnershipTypes } from "@/content/ventures";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Strategic Partnerships",
  description:
    "Partner with Jallal Group — strategic, technology, institutional, business development and investment collaborations for organisations building in Sierra Leone and West Africa.",
  alternates: { canonical: "/partnerships" },
};

const readiness = [
  { label: "Geographic anchor", value: "Sierra Leone · West Africa" },
  { label: "Operating portfolios", value: "Four core companies" },
  { label: "Dialogue pipeline", value: "Active institutional intake" },
  { label: "Target impact", value: "Long-term value creation" },
];

const pillars = [
  {
    index: "Pillar 01",
    icon: "globe" as const,
    title: "Deep local grounding",
    description:
      "Execution capability and market insight within Sierra Leone and emerging West African ecosystems, ensuring realistic deployment pathways.",
    tag: "Sovereign market insight",
  },
  {
    index: "Pillar 02",
    icon: "layers" as const,
    title: "Multidisciplinary stack",
    description:
      "Software, educational cohorts, operational support and physical real estate deployed simultaneously across unified group operations.",
    tag: "Cross-portfolio synergy",
  },
  {
    index: "Pillar 03",
    icon: "shield-check" as const,
    title: "Uncompromising governance",
    description:
      "Commitment to international corporate standards, fiduciary transparency, data integrity and cross-border regulatory compliance.",
    tag: "Fiduciary integrity",
  },
  {
    index: "Pillar 04",
    icon: "clock" as const,
    title: "Long-term vision",
    description:
      "Alignment on sustainable, generational economic growth rather than short-term speculative transactions or extractive models.",
    tag: "Generational value",
  },
];

const contactCards = [
  {
    icon: "building" as const,
    eyebrow: "Central governance",
    title: "Corporate headquarters",
    body: (
      <>
        Bo, Sierra Leone
        <br />
        West Africa
      </>
    ),
    footer: "Primary sovereign operations",
  },
  {
    icon: "mail" as const,
    eyebrow: "Official channels",
    title: "Institutional desk",
    body: (
      <>
        Direct inquiries:
        <br />
        <a
          href={`mailto:${site.email}`}
          className="font-semibold text-ink underline underline-offset-4 hover:text-accent"
        >
          {site.email}
        </a>
        <br />
        Corporate registry: Bo Commercial Registry
      </>
    ),
    footer: "Encrypted corporate email routing",
  },
  {
    icon: "clock" as const,
    eyebrow: "Engagement protocol",
    title: "Operating hours & SLA",
    body: (
      <>
        Monday – Friday: 08:30 – 17:30 GMT
        <br />
        Saturday – Sunday: Executive recess
        <br />
        Formal response SLA: within 48 business hours.
      </>
    ),
    footer: null,
  },
];

export default function PartnershipsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest py-14 text-white lg:py-20">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25 bg-[radial-gradient(#8cff00_1px,transparent_1px)] [background-size:24px_24px]"
        />
        <div className="page-container relative">
          <div className="grid grid-cols-1 items-end gap-8 border-b border-white/10 pb-10 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-7">
              <Eyebrow tone="light">
                Strategic alliances & business development
              </Eyebrow>
              <h1 className="text-display-md font-bold tracking-tight text-white sm:text-display-lg">
                Growth through strategic partnerships.
              </h1>
              <p className="max-w-2xl text-body-lg leading-relaxed text-on-dark-muted">
                Jallal Group welcomes partnerships with organisations,
                institutions, investors and individuals who share our commitment
                to innovation, sustainable business growth and meaningful
                opportunity across emerging African markets.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:col-span-5 lg:items-end">
              <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-body-sm text-on-dark">
                <ShieldCheck className="h-4 w-4 text-lime" />
                Institutional governance standards
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-body-sm text-on-dark">
                <Clock className="h-4 w-4 text-lime" />
                48-hour business review SLA
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {readiness.map((item) => (
              <div key={item.label} className="flex flex-col gap-1.5">
                <dt className="label-caps text-lime">{item.label}</dt>
                <dd className="text-title-md font-medium text-white">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-b border-line bg-surface py-16 lg:py-24">
        <div className="page-container">
          <SectionHeading
            eyebrow="Our strategic edge"
            title="The institutional foundation for mutual expansion."
            description="We combine local execution with institutional discipline — mitigating risk while unlocking high-potential frontier market value."
          />

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <article
                key={pillar.index}
                className="flex h-full flex-col justify-between rounded-lg border border-line bg-white p-6 shadow-card transition-colors hover:border-line-strong"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="label-caps text-muted">{pillar.index}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface text-ink transition-colors group-hover:bg-ink">
                      <Icon name={pillar.icon} className="h-5 w-5" />
                    </span>
                  </div>
                  <h3 className="text-title-md font-semibold text-ink">
                    {pillar.title}
                  </h3>
                  <p className="text-body-sm leading-relaxed text-muted">
                    {pillar.description}
                  </p>
                </div>
                <p className="mt-5 flex items-center gap-2 border-t border-line pt-4 label-caps text-accent">
                  <span className="h-1 w-1 rounded-full bg-accent" />
                  {pillar.tag}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white py-16 lg:py-24">
        <div className="page-container">
          <SectionHeading
            eyebrow="Modalities of engagement"
            title="Structured collaboration frameworks."
            description="External institutional relations are organised into five operational domains so stakeholder alignment and execution stay precise."
          />

          <div className="mt-10 flex flex-col gap-4">
            {partnershipTypes.map((type, index) => (
              <article
                key={type.value}
                className="grid grid-cols-1 gap-5 rounded-lg border border-line bg-surface p-6 shadow-card lg:grid-cols-12 lg:items-center lg:gap-8"
              >
                <div className="flex items-center gap-4 lg:col-span-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-forest text-title-md font-semibold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col">
                    <span className="label-caps text-accent">{type.eyebrow}</span>
                    <h3 className="text-headline-sm font-semibold text-ink">
                      {type.title}
                    </h3>
                  </div>
                </div>

                <p className="text-body-md leading-relaxed text-muted lg:col-span-6">
                  {type.description}
                </p>

                <div className="lg:col-span-2 lg:flex lg:justify-end">
                  <span className="inline-flex rounded-md border border-line bg-white px-3 py-1.5 label-caps text-ink">
                    {type.tag}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="inquiry" className="border-b border-line bg-surface py-16 lg:py-24">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col gap-5 lg:col-span-4">
              <Eyebrow>Formal dialogue</Eyebrow>
              <h2 className="text-headline-lg font-bold tracking-tight text-ink">
                Initiate a partnership dialogue.
              </h2>
              <p className="text-body-md leading-relaxed text-muted">
                Our executive business development team reviews all formal
                inquiries within two business days. Please provide structured
                details regarding your organisation&apos;s mandate and the
                intended scope of cooperation.
              </p>

              <div className="rounded-lg border border-line bg-white p-5 shadow-card">
                <span className="flex items-center gap-2 text-title-md font-semibold text-ink">
                  <Lock className="h-5 w-5 text-accent" />
                  Confidentiality & integrity
                </span>
                <p className="mt-2 text-body-sm leading-relaxed text-muted">
                  All transmitted materials, financial discussions and initial
                  briefs are handled under mutual non-disclosure expectations
                  and institutional privacy governance.
                </p>
              </div>

              <div className="mt-auto hidden flex-col gap-2 border-t border-line pt-5 lg:flex">
                <span className="label-caps text-muted">Executive review SLA</span>
                <span className="flex items-center gap-2 text-title-md font-semibold text-ink">
                  <Clock className="h-5 w-5 text-accent" />
                  48 hours maximum processing
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-white p-6 shadow-card lg:col-span-8 lg:p-8">
              <PartnershipForm />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sunken py-16 lg:py-20">
        <div className="page-container">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {contactCards.map((card) => (
              <article
                key={card.title}
                className="flex flex-col justify-between rounded-lg border border-line bg-white p-6 shadow-card"
              >
                <div className="flex flex-col gap-3">
                  <span className="flex items-center gap-2 label-caps text-accent">
                    <Icon name={card.icon} className="h-4 w-4" />
                    {card.eyebrow}
                  </span>
                  <h3 className="text-title-md font-semibold text-ink">
                    {card.title}
                  </h3>
                  <p className="text-body-md leading-relaxed text-muted">
                    {card.body}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 border-t border-line pt-4 label-caps text-muted">
                  {card.footer === "Primary sovereign operations" ? (
                    <MapPin className="h-3.5 w-3.5" />
                  ) : card.footer ? (
                    <Mail className="h-3.5 w-3.5" />
                  ) : (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                  )}
                  {card.footer ?? "Intake registry open"}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
