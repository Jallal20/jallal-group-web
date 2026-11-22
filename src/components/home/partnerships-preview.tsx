import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icon";
import { partnershipTypes } from "@/content/ventures";
import { Eyebrow } from "@/components/ui/typography";
import { ScrollReveal } from "@/components/layout/scroll-reveal";

export function PartnershipsPreview() {
  const blocks = partnershipTypes.slice(0, 4);

  return (
    <section className="border-t border-line bg-surface py-16 lg:py-24">
      <div className="page-container">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-5 lg:col-span-5">
            <ScrollReveal delay={0}>
              <Eyebrow>Institutional alliances</Eyebrow>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-display-md font-bold tracking-tight text-ink lg:text-display-lg">
                Growth through strategic partnerships.
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-body-lg leading-relaxed text-muted">
                Jallal Group welcomes partnerships with organisations,
                institutions, investors and individuals who share our commitment to
                innovation, sustainable business growth and meaningful opportunity
                creation.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <div className="pt-1">
                <Button href="/partnerships" size="lg" className="btn-press">
                  Engage with our leadership
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7 reveal-group">
            {blocks.map((block) => (
              <article
                key={block.value}
                className="hover-lift rounded-lg border border-line bg-white p-5 shadow-card hover:border-accent/40 hover:shadow-raised"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface text-accent">
                  <Icon name={block.icon} className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-title-md font-semibold text-ink">
                  {block.title}
                </h3>
                <p className="mt-1.5 text-body-sm leading-relaxed text-muted">
                  {block.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
