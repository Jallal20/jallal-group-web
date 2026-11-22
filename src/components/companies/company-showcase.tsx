import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Company } from "@/lib/types";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";

export function CompanyShowcase({ company }: { company: Company }) {
  return (
    <article
      id={company.slug}
      className="grid grid-cols-1 gap-8 rounded-lg border border-line bg-white p-6 shadow-card lg:grid-cols-12 lg:gap-10 lg:p-10"
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
            className="object-cover"
          />
          <span className="absolute bottom-3 left-3 rounded-sm bg-ink/80 px-2.5 py-1 label-caps text-white backdrop-blur">
            {company.shortName} operations
          </span>
        </div>

        <div className="rounded-md border border-line bg-surface p-4">
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
                className="rounded-md border border-line bg-surface p-4"
              >
                <Icon
                  name={capability.icon}
                  className="h-5 w-5 text-accent"
                />
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
          <Button href="/partnerships#inquiry" variant="secondary" size="sm">
            Inquire with {company.shortName}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
