import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Jallal Group collects, uses and protects personal information submitted through this website, including partnership inquiries and venture update requests.",
  alternates: { canonical: "/privacy-policy" },
};

const sections = [
  {
    title: "1. Who we are",
    body: [
      `Jallal Group (${site.legalName}) is a business group registered and operating from ${site.location}. This policy explains how we handle personal information collected through ${site.url}.`,
      "For any question about this policy, contact us at the email address listed at the end of this page.",
    ],
  },
  {
    title: "2. Information we collect",
    body: [
      "We collect information you provide voluntarily when you submit a partnership inquiry or request venture updates: your name, organisation, email address, phone number, the partnership category you select and the content of your message.",
      "We also record limited technical data for abuse prevention, such as a hashed network address and browser string. We do not store raw IP addresses.",
    ],
  },
  {
    title: "3. How we use your information",
    body: [
      "We use submitted information to review, route and respond to your inquiry; to maintain a record of institutional dialogue; and to send the specific updates you requested.",
      "We do not sell personal information, we do not share it with advertisers, and we do not use it for unrelated marketing.",
    ],
  },
  {
    title: "4. Legal basis",
    body: [
      "Where data protection law applies, we process inquiry data on the basis of your consent (given when you submit the form) and our legitimate interest in responding to genuine business correspondence.",
      "You may withdraw consent at any time by contacting us; we will then delete the inquiry record unless we are required to retain it.",
    ],
  },
  {
    title: "5. Storage and retention",
    body: [
      "Inquiry records are stored in a managed cloud database provided by Appwrite, with access restricted to authorised Jallal Group personnel through server-side controls. Database permissions prevent public access to inquiry data.",
      "We retain inquiries for as long as they remain relevant to an active or prospective engagement, and review retention periodically. Records are deleted when they are no longer needed.",
    ],
  },
  {
    title: "6. Cookies",
    body: [
      "This website does not use advertising or cross-site tracking cookies. A strictly necessary session cookie is used only to keep authorised administrators signed in to the private dashboard.",
    ],
  },
  {
    title: "7. Your rights",
    body: [
      "You may request access to the personal information we hold about you, request correction or deletion, or object to processing. We will respond to verified requests within a reasonable period.",
    ],
  },
  {
    title: "8. Security",
    body: [
      "We apply access controls, encryption in transit, least-privilege server credentials and rate limiting on public forms. No system is completely secure, but we review our safeguards as the platform evolves.",
    ],
  },
  {
    title: "9. Changes to this policy",
    body: [
      "We may update this policy to reflect changes in our practices or legal obligations. The current version is always published at this address with its revision date.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="page-container py-12 lg:py-16">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-label-sm text-muted"
          >
            <Link href="/" className="transition-colors hover:text-ink">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink">Privacy policy</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <span className="label-caps text-accent">Legal</span>
            <h1 className="mt-3 text-display-md font-bold tracking-tight text-ink">
              Privacy policy
            </h1>
            <p className="mt-4 text-body-lg leading-relaxed text-muted">
              This policy describes how Jallal Group handles personal
              information submitted through our corporate website.
            </p>
            <p className="mt-2 text-body-sm text-muted">
              Last reviewed: November 2026.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface py-14 lg:py-20">
        <div className="page-container">
          <div className="max-w-3xl">
            {sections.map((section) => (
              <article key={section.title} className="mb-8">
                <h2 className="text-title-md font-semibold text-ink">
                  {section.title}
                </h2>
                <div className="mt-2 flex flex-col gap-3">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 32)}
                      className="text-body-md leading-relaxed text-muted"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}

            <div className="rounded-lg border border-line bg-white p-6">
              <h2 className="text-title-md font-semibold text-ink">
                Contact
              </h2>
              <p className="mt-2 text-body-md leading-relaxed text-muted">
                Privacy requests can be sent to{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="font-semibold text-ink underline underline-offset-2"
                >
                  {site.email}
                </a>{" "}
                or by post to our headquarters in {site.location}.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
