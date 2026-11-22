import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero";
import { AboutPreview } from "@/components/home/about-preview";
import { VisionSection } from "@/components/home/vision";
import { PartnershipsPreview } from "@/components/home/partnerships-preview";
import { CompanyCard } from "@/components/company-card";
import { VentureCard } from "@/components/venture-card";
import { CtaBand } from "@/components/cta-band";
import { ProjectsEvents } from "@/components/home/projects-events";
import { SectionHeading } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { companies } from "@/content/companies";
import { featuredVentures } from "@/content/ventures";
import { listHomepageProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Jallal Group — Building Businesses, Enabling Innovation",
  description:
    "Jallal Group is a Sierra Leonean business group operating across technology, business development, education, real estate and digital ventures — building companies that create lasting value in emerging markets.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { items } = await listHomepageProjects(6);

  return (
    <>
      <HeroSection />
      <AboutPreview />

      <section className="border-b border-line bg-sunken py-16 lg:py-24">
        <div className="page-container">
          <SectionHeading
            eyebrow="Subsidiary operating network"
            title="Corporate portfolio & operating subsidiaries."
            description="Four distinct enterprises driving modernisation across key economic sectors, each engineered for reliability, governance and market expansion."
            actions={
              <Button href="/our-companies" variant="secondary">
                View all companies
              </Button>
            }
          />
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {companies.map((company) => (
              <CompanyCard key={company.slug} company={company} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white py-16 lg:py-24">
        <div className="page-container">
          <SectionHeading
            eyebrow="Innovation pipeline & incubation"
            title="Building digital ventures for real-world needs."
            description="Purpose-built platforms addressing everyday financial, mobility and property access challenges across emerging African markets."
            actions={
              <Button href="/digital-ventures" variant="secondary">
                Explore digital ventures
              </Button>
            }
          />
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredVentures.map((venture) => (
              <VentureCard key={venture.slug} venture={venture} />
            ))}
          </div>
        </div>
      </section>

      <VisionSection />
      <ProjectsEvents items={items} />
      <PartnershipsPreview />
      <CtaBand />
    </>
  );
}
