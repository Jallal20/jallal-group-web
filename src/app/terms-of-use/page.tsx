import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms governing your use of the Jallal Group website, including acceptable use, intellectual property, disclaimers and liability limits.",
  alternates: { canonical: "/terms-of-use" },
};

const sections = [
  {
    title: "1. Acceptance of these terms",
    body: [
      `By accessing ${site.url} (the “website”), you agree to these terms of use. If you do not agree, please do not use the website.`,
      "These terms apply to all visitors, including prospective partners, investors, customers and job applicants.",
    ],
  },
  {
    title: "2. About the website",
    body: [
      `The website is operated by ${site.legalName}, a business group based in ${site.location}. It presents information about our group, portfolio companies, digital ventures and partnership opportunities.`,
      "The website is intended for general informational and business-development purposes. It does not create any binding obligation, offer, invitation to treat, or professional advice unless confirmed in a signed written agreement.",
    ],
  },
  {
    title: "3. Acceptable use",
    body: [
      "You agree not to misuse the website. That includes attempting to gain unauthorised access, interfering with its operation, submitting false or fraudulent inquiries, scraping content at scale, or transmitting malicious code.",
      "We may restrict or block access where we reasonably believe these terms have been breached, including rate-limits and IP bans on public form submissions.",
    ],
  },
  {
    title: "4. Intellectual property",
    body: [
      "All content on this website — including text, branding, logos, imagery, layouts and code — is owned by Jallal Group or its licensors and is protected by applicable intellectual property law.",
      "You may view and print pages for your own internal business use. Any other reproduction, redistribution, modification or commercial use requires our prior written permission.",
    ],
  },
  {
    title: "5. Information about ventures and projects",
    body: [
      "Details about digital ventures, research initiatives, company capabilities and project status reflect our current assessment at the time of publication. Status labels such as “research”, “prototype”, “sandbox” or “development” describe technical readiness, not availability of a finished service to the public.",
      "Nothing on the website constitutes an offer to sell a security, an invitation to invest, or a guarantee of future performance, pricing, timelines or partnerships.",
    ],
  },
  {
    title: "6. Third-party links",
    body: [
      "The website may link to third-party websites or services, including our social media profiles. We do not control their content or policies and are not responsible for them.",
    ],
  },
  {
    title: "7. Submissions and inquiries",
    body: [
      "Information you submit through the partnership or venture forms is handled in accordance with our Privacy Policy.",
      "Sending an inquiry does not establish a confidential relationship. Please do not submit trade secrets, unreleased personal data or other sensitive information through the forms.",
    ],
  },
  {
    title: "8. Disclaimers",
    body: [
      "The website is provided on an “as is” and “as available” basis. To the fullest extent permitted by law, we make no warranties, express or implied, about the accuracy, completeness, availability or fitness for purpose of the website or its content.",
      "We do not warrant that the website will be uninterrupted, error-free or free of harmful components.",
    ],
  },
  {
    title: "9. Limitation of liability",
    body: [
      "To the fullest extent permitted by applicable law, Jallal Group and its officers, employees and agents will not be liable for any indirect, incidental, consequential or special loss arising from your use of, or inability to use, the website or any information contained in it.",
      "Nothing in these terms excludes liability that cannot be excluded under applicable law, including liability for fraud or wilful misconduct.",
    ],
  },
  {
    title: "10. Changes and applicable law",
    body: [
      "We may update these terms from time of publication. Continued use of the website after changes are posted constitutes acceptance of the revised terms.",
      "These terms are governed by the laws of Sierra Leone, and its courts have exclusive jurisdiction over disputes arising from them, subject to any mandatory consumer protections.",
    ],
  },
];

export default function TermsOfUsePage() {
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
            <span className="text-ink">Terms of use</span>
          </nav>

          <div className="mt-6 max-w-3xl">
            <span className="label-caps text-accent">Legal</span>
            <h1 className="mt-3 text-display-md font-bold tracking-tight text-ink">
              Terms of use
            </h1>
            <p className="mt-4 text-body-lg leading-relaxed text-muted">
              These terms govern your use of this website. Please read them
              carefully.
            </p>
            <p className="mt-2 text-body-sm text-muted">Last reviewed: November 2026.</p>
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
                Questions about these terms
              </h2>
              <p className="mt-2 text-body-md leading-relaxed text-muted">
                Contact{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="font-semibold text-ink underline underline-offset-2"
                >
                  {site.email}
                </a>{" "}
                or write to us in {site.location}.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
