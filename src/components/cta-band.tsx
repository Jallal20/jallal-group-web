import { Clock, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/content/site";

export function CtaBand({
  eyebrow = "Initiate dialogue",
  title = "Let's build something meaningful.",
  description = "Connect with Jallal Group to explore business opportunities, strategic partnerships and ventures designed to shape the future of emerging African markets.",
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  return (
    <section className="bg-forest py-16 text-white lg:py-24">
      <div className="page-container">
        <div className="flex flex-col items-center rounded-lg border border-white/10 bg-white/[0.04] px-6 py-12 text-center shadow-overlay md:px-12 lg:px-16 lg:py-16">
          <span className="label-caps text-lime">{eyebrow}</span>
          <h2 className="mt-3 max-w-3xl text-display-md font-bold tracking-tight text-white lg:text-display-lg">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-body-lg leading-relaxed text-on-dark-muted">
            {description}
          </p>

          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <Button href="/partnerships#inquiry" variant="accent" size="lg">
              Partner with us
            </Button>
            <Button
              href="/our-companies"
              size="lg"
              className="border border-white/20 bg-transparent text-white hover:bg-white hover:text-ink"
            >
              Explore our companies
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/10 pt-6 text-body-sm text-on-dark-muted">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-lime" />
              {site.location}
            </span>
            <a
              href={`mailto:${site.email}`}
              className="flex items-center gap-2 transition-colors hover:text-white"
            >
              <Mail className="h-4 w-4 text-lime" />
              {site.email}
            </a>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-lime" />
              Mon–Fri · 08:30–17:30 GMT
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
