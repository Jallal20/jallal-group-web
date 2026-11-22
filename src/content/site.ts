export const site = {
  name: "Jallal Group",
  legalName: "Jallal Group",
  tagline: "",
  description:
    "Jallal Group is a Sierra Leone-based business group building companies, digital platforms and innovative solutions across technology, education, real estate and digital ventures.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.jallalgroup.com",
  email: "partnerships@jallalgroup.com",
  location: "Bo, Sierra Leone",
  founded: "2021",
  social: {
    linkedin: "https://www.linkedin.com/company/jallal-group",
    x: "https://x.com/jallalgroup",
  },
} as const;

export const primaryNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Companies", href: "/our-companies" },
  { label: "Digital Ventures", href: "/digital-ventures" },
  { label: "Partnerships", href: "/partnerships" },
] as const;

export const footerNav = [
  {
    title: "Overview",
    links: [
      { label: "Home", href: "/" },
      { label: "About Jallal Group", href: "/about" },
  { label: "Companies", href: "/our-companies" },
      { label: "Digital Ventures", href: "/digital-ventures" },
    ],
  },
  {
    title: "Portfolio",
    links: [
      { label: "Jallal Tech", href: "/companies/jallal-tech" },
      { label: "Elevate 360", href: "/companies/elevate-360" },
      {
        label: "Jallal Institute of Technology",
        href: "/companies/jallal-institute-of-technology",
      },
      {
        label: "Jallal Properties Group",
        href: "/companies/jallal-properties-group",
      },
    ],
  },
  {
    title: "Innovation",
    links: [
      { label: "Jallal Pay", href: "/digital-ventures#jallal-pay" },
      { label: "Waka Salone", href: "/digital-ventures#waka-salone" },
      { label: "First Home", href: "/digital-ventures#first-home" },
      { label: "Research pipeline", href: "/digital-ventures#pipeline" },
    ],
  },
  {
    title: "Engagement",
    links: [
      { label: "Strategic partnerships", href: "/partnerships" },
      { label: "Partnership inquiry", href: "/partnerships#inquiry" },
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms of use", href: "/terms-of-use" },
    ],
  },
] as const;

export const legalNav = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Use", href: "/terms-of-use" },
] as const;
