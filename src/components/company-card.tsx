import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { Company } from "@/lib/types";

export function CompanyCard({ company }: { company: Company }) {
  return (
    <article className="group hover-lift rounded-lg border border-line bg-white p-6 shadow-card hover:border-accent/40 hover:shadow-raised lg:p-8">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <span className="label-caps text-ink">
            {company.index} / {company.category}
          </span>
          <span className="rounded-sm border border-line bg-surface px-2 py-0.5 text-label-sm font-medium text-muted">
            Active core
          </span>
        </div>

        <h3 className="text-headline-md font-bold tracking-tight text-ink lg:text-headline-lg">
          {company.name}
        </h3>

        <p className="mt-3 text-body-md leading-relaxed text-muted">
          {company.tagline}
        </p>

        <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2.5 border-t border-line pt-5 sm:grid-cols-2">
          {company.capabilities.map((capability) => (
            <li key={capability.title} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span className="text-body-sm text-body">{capability.title}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-line pt-5">
        <div className="flex gap-6">
          {company.metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col">
              <span className="text-headline-sm font-bold text-ink">
                {metric.value}
              </span>
              <span className="label-caps text-muted">{metric.label}</span>
            </div>
          ))}
        </div>
        <Link
          href={`/companies/${company.slug}`}
          className="flex items-center gap-1.5 text-body-sm font-semibold text-ink transition-colors hover:text-accent btn-press"
        >
          Explore company
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}
