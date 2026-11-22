const bars = [
  { label: "Strategic autonomy", value: "Maintained", width: "w-full" },
  { label: "Inter-subsidiary synergy", value: "Shared infrastructure", width: "w-3/4" },
  { label: "Long-term capital horizon", value: "Generational", width: "w-5/6" },
];

const columns = [
  {
    title: "Domestic grounding",
    description:
      "Rooted directly in Sierra Leone's physical and digital economy, with a working understanding of local market dynamics and citizen priorities.",
  },
  {
    title: "International scale",
    description:
      "Applying world-class architecture and technical discipline so every subsidiary can scale sustainably across West Africa.",
  },
];

export function VisionSection() {
  return (
    <section className="relative overflow-hidden bg-forest py-16 text-white lg:py-24">
      <div
        aria-hidden="true"
        className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-lime/10 blur-3xl"
      />
      <div className="page-container relative">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col gap-6 lg:col-span-8">
            <span className="label-caps inline-flex items-center gap-3 text-lime">
              <span aria-hidden="true" className="h-px w-8 bg-lime" />
              Conglomerate mandate
            </span>
            <h2 className="max-w-3xl text-display-md font-bold tracking-tight text-white lg:text-display-lg">
              From local innovation to global opportunity.
            </h2>
            <p className="max-w-2xl text-body-lg leading-relaxed text-on-dark-muted">
              Jallal Group is driven by the ambition to build sustainable
              businesses, develop meaningful technology and create opportunities
              that contribute to the growth of Sierra Leone and the wider African
              economy.
            </p>

            <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
              {columns.map((column) => (
                <div key={column.title} className="flex flex-col gap-2">
                  <span className="label-caps text-lime">{column.title}</span>
                  <p className="text-body-md leading-relaxed text-on-dark-muted">
                    {column.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
              <span className="label-caps text-lime">Group blueprint</span>
              <div className="mt-5 space-y-5">
                {bars.map((bar) => (
                  <div key={bar.label} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3 text-body-sm">
                      <span className="text-on-dark-muted">{bar.label}</span>
                      <span className="font-semibold text-lime">{bar.value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className={`h-full rounded-full bg-lime ${bar.width}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <figure className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <blockquote className="text-body-sm italic leading-relaxed text-on-dark-muted">
                “We don&apos;t just build companies to capture value; we engineer
                systems that create lasting sovereign resilience.”
              </blockquote>
              <figcaption className="label-caps mt-3 text-lime">
                Jallal Group leadership
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
