import Link from "next/link";
import Image from "next/image";
import { footerNav, legalNav, site } from "@/content/site";
import { Icon } from "@/components/icon";
import { ScrollReveal } from "@/components/layout/scroll-reveal";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-forest text-white">
      <div className="page-container pb-8 pt-16">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-4 lg:col-span-4">
            <Link href="/" className="flex items-center gap-4">
              <Image
                src="/images/logo.png"
                alt="Jallal Group"
                width={64}
                height={64}
                className="h-16 w-16 object-contain"
              />
            </Link>
            <ScrollReveal delay={0}>
              <p className="max-w-sm text-body-sm leading-relaxed text-on-dark-muted">
                A diversified, technology-driven business group building
                companies, digital platforms and innovative solutions for
                emerging markets across Sierra Leone and beyond.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="flex items-center gap-2 self-start rounded-md border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
                </span>
                <span className="label-caps text-on-dark">
                  HQ · Bo, Sierra Leone
                </span>
              </div>
            </ScrollReveal>
          </div>

          {footerNav.map((column) => (
            <ScrollReveal key={column.title} delay={0.1}>
              <div key={column.title} className="flex flex-col gap-3 lg:col-span-2">
                <h3 className="label-caps text-lime">{column.title}</h3>
                <ul className="flex flex-col gap-2.5 text-body-sm text-on-dark-muted">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center gap-1.5 transition-colors hover:text-white hover:pl-1"
                      >
                        {link.label}
                        <span
                          className="h-px w-px bg-lime transition-all group-hover:w-2"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}

          <ScrollReveal delay={0.1}>
            <div className="flex flex-col gap-3 lg:col-span-2">
              <h3 className="label-caps text-lime">Contact</h3>
              <ul className="flex flex-col gap-3 text-body-sm text-on-dark-muted">
                <li className="flex gap-2">
                  <Icon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                  <span>{site.location}</span>
                </li>
                <li className="flex gap-2">
                  <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-lime" />
                  <a
                    href={`mailto:${site.email}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-white hover:pl-1"
                  >
                    {site.email}
                    <span className="h-px w-px bg-lime transition-all group-hover:w-2" />
                  </a>
                </li>
              {[
                "+232 31 435 238",
                "+232 72 025 505",
                "+232 72 264 297",
                "+232 80 360 996",
              ].map((number) => (
                  <li key={number} className="flex gap-2">
                    <Icon
                      name="phone"
                      className="mt-0.5 h-4 w-4 shrink-0 text-lime"
                    />
                    <a
                      href={`tel:${number.replace(/\s/g, "")}`}
                      className="flex items-center gap-1.5 transition-colors hover:text-white hover:pl-1"
                    >
                      {number}
                      <span className="h-px w-px bg-lime transition-all group-hover:w-2" />
                    </a>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 pt-1">
                <a
                  href={site.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Jallal Group on LinkedIn"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-on-dark-muted transition-colors hover:border-lime hover:text-lime"
                >
                  <span aria-hidden="true" className="text-[11px] font-bold">
                    in
                  </span>
                </a>
                <a
                  href={site.social.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Jallal Group on X"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-on-dark-muted transition-colors hover:border-lime hover:text-lime"
                >
                  <span aria-hidden="true" className="text-[11px] font-bold">
                    X
                  </span>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-body-sm text-on-dark-muted md:flex-row">
          <ScrollReveal delay={0.1}>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {legalNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/partnerships"
                className="transition-colors hover:text-white"
              >
                Partnerships
              </Link>
            </div>
          </ScrollReveal>
          <p className="text-center md:text-right">
            © {new Date().getFullYear()} {site.legalName}. All rights reserved.
            Built with long-term vision in Bo, Sierra Leone.
          </p>
        </div>
      </div>
    </footer>
  );
}
