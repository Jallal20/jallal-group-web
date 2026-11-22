import Link from "next/link";
import { Button } from "@/components/ui/button";
import { primaryNav } from "@/content/site";

export default function NotFound() {
  return (
    <section className="bg-forest py-20 text-white lg:py-32">
      <div className="page-container">
        <div className="max-w-2xl">
          <span className="label-caps text-lime">Error 404</span>
          <h1 className="mt-4 text-display-md font-bold tracking-tight text-white lg:text-display-lg">
            This page could not be found.
          </h1>
          <p className="mt-4 text-body-lg leading-relaxed text-on-dark-muted">
            The address may be mistyped, or the page may have moved. Return to
            the homepage or continue with one of the sections below.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/">Back to homepage</Button>
            <Button href="/partnerships#inquiry" variant="secondary">
              Start a partnership inquiry
            </Button>
          </div>

          <nav aria-label="Site sections" className="mt-10 border-t border-white/10 pt-6">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-body-sm">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-on-dark-muted underline-offset-4 transition-colors hover:text-white hover:underline"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
