import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/layout/scroll-reveal";

const metrics = [
  { value: "04", label: "Core divisions" },
  { value: "03", label: "Digital platforms" },
  { value: "100%", label: "Regionally anchored" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-white">
      <div
        aria-hidden="true"
        className="surface-grid pointer-events-none absolute inset-0 opacity-50"
      />

      <div className="page-container relative py-12 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex min-w-0 flex-col items-start gap-6 lg:col-span-7">
            <ScrollReveal delay={0}>
              <span className="inline-flex items-center gap-2 rounded-md bg-surface px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="label-caps text-ink">
                  Sierra Leone - Emerging markets - Enterprise ecosystem
                </span>
              </span>
            </ScrollReveal>

            <ScrollReveal delay={0.1}>
              <h1 className="max-w-3xl text-display-md font-bold tracking-tight text-ink sm:text-display-lg lg:text-display-xl">
                Building businesses.
                <br />
                <span className="text-accent">Enabling innovation.</span>
                <br />
                Shaping the future.
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="max-w-xl text-body-lg leading-relaxed text-muted">
                Jallal Group is a growing business group focused on technology,
                innovation, real estate, education and digital ventures. We build
                businesses and solutions designed to create lasting value across
                Sierra Leone and beyond.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row">
                <Button href="/our-companies/jallal-tech" size="lg" className="btn-press">
                  Explore our companies
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href="/partnerships#inquiry" variant="secondary" size="lg" className="btn-press">
                  Partner with us
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.4}>
              <dl className="mt-4 grid w-full grid-cols-3 gap-4 border-t border-line pt-6">
                {metrics.map((metric) => (
                  <div key={metric.label} className="flex flex-col gap-1">
                    <dd className="order-1 text-headline-sm font-bold text-ink lg:text-headline-md">
                      {metric.value}
                    </dd>
                    <dt className="order-2 label-caps text-muted">
                      {metric.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </ScrollReveal>
          </div>

          <div className="relative lg:col-span-5">
            <ScrollReveal delay={0.1}>
              <div className="rounded-lg border border-line bg-surface p-2 shadow-raised">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded">
                  <Image
                    src="/images/hero.jpg"
                    alt="Jallal Group teams reviewing business and technical plans in Bo"
                    fill
                    sizes="(min-width: 1024px) 40vw, 100vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />

                  <div className="absolute inset-x-3 bottom-3 rounded-md border border-white/10 bg-white/95 p-4 shadow-card backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-forest">
                          <span className="h-2 w-2 rounded-full bg-lime" />
                        </span>
                        <span className="label-caps text-ink">
                          Strategic group entity
                        </span>
                      </span>
                      <span className="text-label-sm text-muted">
                        Bo, Sierra Leone
                      </span>
                    </div>
                    <p className="mt-2 text-body-sm leading-relaxed text-muted">
                      Orchestrating capital, institutional governance and technical
                      architecture across emerging markets.
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -top-3 right-3 hidden items-center gap-2 rounded-md bg-forest px-3 py-2 shadow-raised sm:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-lime" />
                <span className="label-caps text-lime">Sovereign focus</span>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
