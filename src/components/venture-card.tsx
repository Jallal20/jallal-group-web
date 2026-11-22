import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { IconName, Venture } from "@/lib/types";
import { Icon } from "@/components/icon";
import { StatusPill } from "@/components/status-pill";

const ventureIcons: Record<string, IconName> = {
  "jallal-pay": "wallet",
  "waka-salone": "bus",
  "first-home": "home",
};

export function VentureCard({ venture }: { venture: Venture }) {
  const iconName = ventureIcons[venture.slug] ?? "rocket";

  return (
    <article className="group hover-lift rounded-lg border border-line bg-white p-6 shadow-card hover:border-accent/40 hover:shadow-raised lg:p-7">
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="label-caps text-accent">{venture.category}</span>
          <StatusPill status={venture.status} />
        </div>

        <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-md bg-surface text-ink">
          <Icon name={iconName} className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-headline-md font-bold text-ink">
          {venture.name}
        </h3>
        <p className="mt-2 text-body-md leading-relaxed text-muted">
          {venture.tagline}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-md bg-surface px-4 py-3">
        <span className="text-body-sm text-muted">{venture.meta.label}</span>
        <span className="text-body-sm font-semibold text-ink">
          {venture.meta.value}
        </span>
      </div>

      <div className="mt-4">
        <Link
          href={`/digital-ventures#${venture.slug}`}
          className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-ink transition-colors hover:text-accent btn-press"
        >
          View venture
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
