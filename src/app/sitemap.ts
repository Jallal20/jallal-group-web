import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { companies } from "@/content/companies";
import { primaryNav } from "@/content/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url.replace(/\/$/, "");

  const staticPages = primaryNav
    .map((item) => item.href)
    .filter((href) => href !== "/")
    .map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "/partnerships" ? 0.9 : 0.7,
    }));

  const companyPages = companies.map((company) => ({
    url: `${base}/our-companies/${company.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const legalPages: MetadataRoute.Sitemap = [
    `${base}/privacy-policy`,
    `${base}/terms-of-use`,
  ].map((url) => ({
    url,
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...staticPages,
    ...companyPages,
    ...legalPages,
  ];
}
