import Image from "next/image";
import { Eyebrow } from "@/components/ui/typography";

export function VenturesHero() {
  return (
    <section className="relative overflow-hidden bg-forest py-14 text-white lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
      >
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="tech-grid"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="#8cff00"
                strokeWidth="0.75"
              />
              <circle cx="2" cy="2" r="1.2" fill="#8cff00" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tech-grid)" />
        </svg>
      </div>
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-lime/10 blur-3xl"
      />

      <div className="page-container relative">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 label-caps text-on-dark">
            Studio ref: JG-DV
          </span>
          <span aria-hidden="true" className="text-on-dark-muted">
            /
          </span>
          <span className="label-caps text-lime">Sovereign tech pipeline</span>
        </div>

        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-8">
            <span className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
              </span>
              <span className="label-caps text-lime">
                Venture incubation & product studio
              </span>
            </span>

            <h1 className="max-w-4xl text-display-md font-bold tracking-tight text-white sm:text-display-lg lg:text-display-xl">
              Building digital ventures for real-world needs.
            </h1>
            <p className="max-w-2xl text-body-lg leading-relaxed text-on-dark-muted">
              Jallal Group incubates proprietary digital platforms designed to
              resolve structural friction in African payments, urban mobility and
              property access.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur lg:col-span-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="label-caps text-on-dark">Studio status</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-lime/15 px-2 py-1 text-label-sm font-medium text-lime">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                Active prototyping
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <div className="text-headline-md font-bold text-white">03</div>
                <div className="label-caps mt-1 text-on-dark-muted">
                  Core platforms
                </div>
              </div>
              <div>
                <div className="text-headline-md font-bold text-lime">100%</div>
                <div className="label-caps mt-1 text-on-dark-muted">
                  Proprietary IP
                </div>
              </div>
            </div>

            <p className="mt-4 border-t border-white/10 pt-4 text-body-sm leading-relaxed text-on-dark-muted">
              Direct engineering allocations targeted at Sierra Leonean
              infrastructure gaps with regional portability.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function IncubationSection() {
  const steps = [
    {
      index: "01 / Discovery",
      title: "Structural audit",
      description:
        "Direct economic observation of informal cash bottlenecks, transit inefficiencies and title ambiguities.",
    },
    {
      index: "02 / Architecture",
      title: "Resilient specs",
      description:
        "Offline-first patterns, local cloud deployments, low-bandwidth data caches and bank-grade cryptography.",
    },
    {
      index: "03 / Staged deploy",
      title: "Pragmatic rollout",
      description:
        "Controlled sandbox deployments with enterprise counterparties before commercial scale.",
    },
  ];

  return (
    <section className="border-b border-line bg-surface py-16 lg:py-24">
      <div className="page-container">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <div className="overflow-hidden rounded-lg border border-line bg-white p-2 shadow-card">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src="/images/ventures-studio.jpg"
                  alt="Engineers reviewing architectural system diagrams in a technical studio"
                  fill
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-line bg-white p-4 shadow-card">
              <span className="label-caps text-accent">
                Methodology statement
              </span>
              <p className="mt-1.5 text-body-sm leading-relaxed text-muted">
                Every venture begins with in-situ field observation to map
                analog bottlenecks before committing a single line of production
                code.
              </p>
            </div>
          </div>

          <div className="order-1 flex flex-col gap-5 lg:order-2 lg:col-span-7">
            <Eyebrow>Studio incubation framework</Eyebrow>
            <h2 className="text-display-md font-bold tracking-tight text-ink lg:text-headline-lg">
              Grounded engineering for high-friction markets.
            </h2>
            <p className="text-body-lg leading-relaxed text-muted">
              Rather than transplanting foreign paradigms into local ecosystems,
              Jallal Group identifies systemic, real-world structural friction in
              Sierra Leone&apos;s domestic economy. We assemble cross-functional
              product teams to prototype and deploy resilient digital
              infrastructure with discipline.
            </p>

            <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
              {steps.map((step) => (
                <article
                  key={step.index}
                  className="rounded-lg border border-line bg-white p-5 shadow-card"
                >
                  <span className="label-caps text-accent">{step.index}</span>
                  <h3 className="mt-2 text-title-md font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-body-sm leading-relaxed text-muted">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
