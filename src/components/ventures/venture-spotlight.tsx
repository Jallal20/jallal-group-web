import Image from "next/image";
import type { ReactNode } from "react";
import type { IconName, Venture } from "@/lib/types";
import { Icon } from "@/components/icon";
import { StatusPill } from "@/components/status-pill";

export function VentureSpotlight({
  venture,
  callout,
  panel,
  actions,
}: {
  venture: Venture;
  callout: { icon: IconName; title: string; text: string };
  panel: ReactNode;
  actions: ReactNode;
}) {
  return (
    <article
      id={venture.slug}
      className="scroll-mt-28 rounded-lg border border-line bg-white p-6 shadow-card transition-shadow hover:shadow-raised lg:p-10"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col gap-5 lg:col-span-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-forest px-3 py-1.5 label-caps text-white">
              {venture.index} / {venture.category}
            </span>
            <StatusPill status={venture.status} />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-headline-lg font-bold tracking-tight text-ink">
              {venture.name}
            </h2>
            <span className="label-caps text-muted">{venture.tagline}</span>
          </div>

          <p className="text-body-lg leading-relaxed text-muted">
            {venture.description}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {venture.capabilities.map((capability) => (
              <div
                key={capability.title}
                className="rounded-md border border-line bg-surface p-4"
              >
                <div className="flex items-center gap-2">
                  <Icon name={capability.icon} className="h-5 w-5 text-accent" />
                  <span className="text-title-md font-semibold text-ink">
                    {capability.title}
                  </span>
                </div>
                <p className="mt-1.5 text-body-sm leading-relaxed text-muted">
                  {capability.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-md border border-line bg-sunken p-4">
            <Icon name={callout.icon} className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <span className="label-caps text-ink">{callout.title}</span>
              <p className="mt-1 text-body-sm leading-relaxed text-muted">
                {callout.text}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">{actions}</div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          {panel}

          <figure className="overflow-hidden rounded-lg border border-line">
            <div className="relative aspect-[16/9]">
              <Image
                src={venture.image}
                alt={venture.imageAlt}
                fill
                sizes="(min-width: 1024px) 36vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="flex items-center justify-between gap-3 bg-white px-4 py-3 text-label-sm text-muted">
              <span>{venture.category}</span>
              <span className="font-semibold text-ink">{venture.meta.value}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </article>
  );
}
