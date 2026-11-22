import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "@/lib/appwrite-browser";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { site } from "@/content/site";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const titleDefault = `${site.name} — Technology, Ventures & Enterprise Growth in Sierra Leone`;
const logoUrl = `${site.url}/images/logo.png`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: titleDefault,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "Jallal Group",
    "Sierra Leone business group",
    "technology company Bo",
    "digital ventures Sierra Leone",
    "real estate Sierra Leone",
    "technical education West Africa",
    "business development Sierra Leone",
    "African innovation",
    "Jallal Group Bo Sierra Leone",
  ],
  authors: [{ name: "Jallal Group", url: site.url }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: titleDefault,
    description: site.description,
    images: [
      {
        url: logoUrl,
        width: 512,
        height: 512,
        alt: "Jallal Group — official logo",
        type: "image/png",
      },
      {
        url: `${site.url}/images/hero.jpg`,
        width: 1200,
        height: 630,
        alt: "Jallal Group — building businesses and enabling innovation",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@jallalgroup",
    title: titleDefault,
    description: site.description,
    images: [logoUrl, `${site.url}/images/hero.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#062b12",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  legalName: site.legalName,
  url: site.url,
  logo: logoUrl,
  email: site.email,
  description: site.description,
  foundingDate: site.founded,
  address: {
    "@type": "PostalAddress",
    streetAddress: "",
    addressLocality: "Bo",
    addressRegion: "",
    postalCode: "",
    addressCountry: "SL",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+232-31-435-238",
    contactType: "customer service",
    availableLanguage: ["en"],
    contactOption: "tollfree",
    areaServed: "SL",
  },
  sameAs: [
    site.social.linkedin,
    site.social.x,
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
          <link rel="shortcut icon" href="/favicon.ico" />
        </head>
        <SiteHeader />
        <main id="main-content" className="flex-1 pt-20">
          {children}
        </main>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
