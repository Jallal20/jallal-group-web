import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/cta-band";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { Eyebrow, SectionHeading } from "@/components/ui/typography";
import { ScrollReveal } from "@/components/layout/scroll-reveal";
import {
  EarlyAccessDialog,
  VENTURE_INTEREST_TYPE,
} from "@/components/ventures/early-access-dialog";
import { VentureSpotlight } from "@/components/ventures/venture-spotlight";
import {
  IncubationSection,
  VenturesHero,
} from "@/components/ventures/ventures-hero";
import { getVenture } from "@/content/ventures";
export const metadata: Metadata = {
  title: "Digital Ventures",
  description:
    "The Jallal Group venture studio — Jallal Pay, Waka Salone and First Home: proprietary digital platforms for payments, mobility and property in Sierra Leone and West Africa.",
  alternates: { canonical: "/digital-ventures" },
};

function PayPanel() {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-forest shadow-raised">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="ml-2 label-caps text-on-dark">
            jallal-core-api.yaml
          </span>
        </div>
        <span className="font-mono text-xs text-lime">v0.4.2-proto</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-on-dark">
        <code>{`POST /v1/settlement/interop
Host: sandbox.jallalpay.sl
Authorization: Bearer sec_sandbox_…
Content-Type: application/json

{
  "source_rail": "MNO_DIRECT",
  "destination_rail": "BANK_CLEARING",
  "currency": "SLE",
  "amount": 2500.00,
  "offline_resilient": true,
  "verification_sig": "ed25519:f9c8…44b"
}`}</code>
      </pre>
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
        <span className="label-caps text-on-dark-muted">Latency target</span>
        <span className="font-mono text-sm font-bold text-lime">
          &lt; 380ms end-to-end
        </span>
      </div>
    </div>
  );
}

function MobilityPanel() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="label-caps text-ink">Transit node modelling</span>
        <span className="font-mono text-label-sm text-accent">
          Peninsula corridor
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between gap-3 text-body-sm">
            <span className="text-muted">Lumley → Central Bo</span>
            <span className="font-semibold text-ink">24 min avg</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full w-3/4 rounded-full bg-accent" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between gap-3 text-body-sm">
            <span className="text-muted">Waterloo → CBD rail telemetry</span>
            <span className="font-semibold text-ink">In modelling</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full w-1/3 rounded-full bg-forest" />
          </div>
        </div>
      </div>

      <p className="mt-4 border-t border-line pt-3 text-body-sm text-muted">
        Route timings are derived from prototype field capture and remain
        pre-launch estimates.
      </p>
    </div>
  );
}

function PropertyPanel() {
  const rows = [
    { label: "Cadastral survey alignment", state: "Verified" },
    { label: "Ministry of Lands registry match", state: "Verified" },
    { label: "Digital escrow title assignment", state: "Sandbox" },
  ];

  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-card">
      <span className="label-caps text-ink">
        Property verification pipeline preview
      </span>
      <ul className="mt-3 flex flex-col">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-body-sm last:border-b-0"
          >
            <span className="flex items-center gap-2 text-muted">
              <Icon
                name={row.state === "Verified" ? "check" : "clock"}
                className={`h-4 w-4 ${row.state === "Verified" ? "text-accent" : "text-muted"}`}
              />
              {row.label}
            </span>
            <span
              className={`font-mono text-xs font-bold ${row.state === "Verified" ? "text-accent" : "text-muted"}`}
            >
              {row.state.toUpperCase()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const principles = [
  {
    icon: "database" as const,
    title: "Data sovereignty",
    description:
      "Citizen transactional and personal records remain hosted within verified localised nodes in line with national privacy and data localisation guidance.",
  },
  {
    icon: "lock" as const,
    title: "Zero-trust security",
    description:
      "Bank-grade tokenisation across every data layer, with mutual TLS authentication and role-based access control at the perimeter.",
  },
  {
    icon: "bus" as const,
    title: "Offline-first logic",
    description:
      "Frontends degrade gracefully. Applications cache critical ledger data locally and sync once network uplinks recover.",
  },
  {
    icon: "network" as const,
    title: "Local edge hosting",
    description:
      "Peering and caching layers positioned for West African users keep domestic interaction latency low and predictable.",
  },
];

const researchIcons = ["activity", "leaf", "sun"] as const;

export default function DigitalVenturesPage() {
  const pay = getVenture("jallal-pay");
  const mobility = getVenture("waka-salone");
  const property = getVenture("first-home");

  return (
    <>
      <VenturesHero />
      <IncubationSection />

      <section className="border-b border-line bg-white py-16 lg:py-24">
        <div className="page-container flex flex-col gap-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <ScrollReveal delay={0}>
              <SectionHeading
                eyebrow="Active ventures"
                title="The production pipeline."
                description="Current initiatives engineered within the Jallal Group venture studio. Development status reflects verified technical readiness — nothing here is presented as launched."
              />
            </ScrollReveal>
          </div>

          {pay ? (
            <VentureSpotlight
              venture={pay}
              callout={{
                icon: "shield-check",
                title: "Engineering milestone",
                text: "Completing regulatory compliance architecture and institutional testing sandbox integrations with regional banking partners.",
              }}
              panel={<PayPanel />}
              actions={
                <>
                  <EarlyAccessDialog label="Register for early venture updates" />
                  <Button href="/partnerships#inquiry" variant="secondary">
                    Discuss a payments integration
                  </Button>
                </>
              }
            />
          ) : null}

          {mobility ? (
            <VentureSpotlight
              venture={mobility}
              callout={{
                icon: "bus",
                title: "Development mandate",
                text: "Addressing everyday congestion, reducing transit wait times and improving commute predictability in Bo, Sierra Leone and connected regional corridors.",
              }}
              panel={<MobilityPanel />}
              actions={
                <>
                  <EarlyAccessDialog label="Follow mobility development" />
                  <Button href="/partnerships#inquiry" variant="secondary">
                    Explore transit collaboration
                  </Button>
                </>
              }
            />
          ) : null}

          {property ? (
            <VentureSpotlight
              venture={property}
              callout={{
                icon: "file-check",
                title: "Synergy with physical assets",
                text: "Built in tandem with Jallal Properties Group so digital listings are backed by tangible, surveyed real-estate holdings.",
              }}
              panel={<PropertyPanel />}
              actions={
                <>
                  <EarlyAccessDialog label="Follow propTech development" />
                  <Button href="/partnerships#inquiry" variant="secondary">
                    View propTech initiative
                  </Button>
                </>
              }
            />
          ) : null}
        </div>
      </section>

      <ResearchSection />

      <section className="border-b border-line bg-forest py-16 text-white lg:py-24">
        <div className="page-container">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="flex flex-col gap-5 lg:col-span-5">
              <Eyebrow tone="light">Engineering governance</Eyebrow>
              <h2 className="text-headline-lg font-bold tracking-tight text-white">
                Built on uncompromising principles of sovereign technology.
              </h2>
              <p className="text-body-lg leading-relaxed text-on-dark-muted">
                Every digital platform built inside Jallal Group adheres to
                rigorous standards of digital sovereignty, client data
                confidentiality and localised infrastructural resilience.
              </p>
              <blockquote className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-body-sm leading-relaxed text-on-dark">
                “We do not treat emerging-market users as edge cases for foreign
                server clusters. We build architectures that assume limited
                bandwidth, sovereign storage requirements and high-frequency
                real-world transactions.”
              </blockquote>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
              {principles.map((principle) => (
                <article
                  key={principle.title}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-6"
                >
                  <Icon
                    name={principle.icon}
                    className="h-7 w-7 text-lime"
                  />
                  <h3 className="mt-4 text-title-md font-semibold text-white">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-body-sm leading-relaxed text-on-dark-muted">
                    {principle.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sunken py-16 lg:py-24">
        <div className="page-container">
          <div className="flex flex-col gap-4 rounded-lg border border-line bg-white p-8 shadow-card lg:flex-row lg:items-center lg:justify-between lg:p-12">
            <div className="flex max-w-2xl flex-col gap-4">
              <span className="flex items-center gap-2.5 label-caps text-accent">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                Institutional & technical engagement
              </span>
              <h2 className="text-headline-lg font-bold tracking-tight text-ink">
                Interested in co-building or piloting our digital platforms?
              </h2>
              <p className="text-body-lg leading-relaxed text-muted">
                Whether you are a financial institution seeking payment rails, an
                urban transit syndicate, or an investor exploring
                technology-enabled real assets, the venture studio invites
                strategic dialogue.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <Button href="/partnerships#inquiry" size="lg">
                Open partnership dialogue
              </Button>
              <EarlyAccessDialog
                label="Request API sandbox"
                variant="secondary"
              />
            </div>
          </div>

          <p className="mt-6 text-body-sm text-muted">
            Interested in another area?{" "}
            <Link
              href="/partnerships"
              className="font-semibold text-ink underline underline-offset-2 hover:text-accent"
            >
              Tell us what you are building
            </Link>
            .
          </p>
        </div>
      </section>

      <CtaBand
        eyebrow="Venture studio"
        title="Build the next platform with us."
        description="From fintech rails to mobility grids and property verification, we co-develop with institutions that share our standards."
      />
    </>
  );
}

function ResearchSection() {
  const items = [
    {
      slug: "healthtech-access",
      icon: researchIcons[0],
      focus: "Supply integrity",
      stage: "TRL-2 research",
      title: "HealthTech access tools",
      description:
        "Low-bandwidth telemedicine routing and pharmaceutical authenticity verification using secure packaging tokens to counter counterfeit medical supplies in rural districts.",
    },
    {
      slug: "agritech-telemetry",
      icon: researchIcons[1],
      focus: "Post-harvest loss",
      stage: "TRL-2 research",
      title: "Agri-tech supply telemetry",
      description:
        "Cold-chain logistics telemetry and wholesale price-discovery tools connecting agrarian smallholders directly to commercial urban distributors.",
    },
    {
      slug: "renewable-iot",
      icon: researchIcons[2],
      focus: "Decentralised power",
      stage: "TRL-1 ideation",
      title: "Renewable energy IoT monitoring",
      description:
        "Embedded sensor firmware capturing generation metrics, battery storage cycles and micro-grid telemetry for off-grid solar infrastructure.",
    },
  ];

  return (
    <section id="pipeline" className="border-b border-line bg-surface py-16 lg:py-24">
      <div className="page-container">
        <SectionHeading
          eyebrow="R&D horizons"
          title="Future digital ventures & research pipeline."
          description="The studio continuously conducts technical feasibility investigations aligned with domestic priorities and national sustainable development benchmarks. These areas are early-stage research — not launched products."
        />

        <div className="mt-10 reveal-group grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.slug}
              id={item.slug}
              className="hover-lift flex h-full scroll-mt-28 flex-col justify-between rounded-lg border border-line bg-white p-6 shadow-card hover:border-accent/40 hover:shadow-raised"
            >
              <div className="flex flex-col gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface text-ink">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <div>
                  <span className="label-caps text-muted">Exploratory phase</span>
                  <h3 className="mt-1.5 text-headline-sm font-semibold text-ink">
                    {item.title}
                  </h3>
                </div>
                <p className="text-body-sm leading-relaxed text-muted">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-line pt-4 label-caps text-muted">
                <span>Focus: {item.focus}</span>
                <span className="font-mono font-bold text-accent">
                  {item.stage}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button href="/partnerships#inquiry" variant="secondary" size="sm">
            Propose a research collaboration
            <ArrowRight className="h-4 w-4" />
          </Button>
          <span className="text-body-sm text-muted">
            Research themes are tracked under venture type “
            {VENTURE_INTEREST_TYPE}” for partner updates.
          </span>
        </div>
      </div>
    </section>
  );
}
