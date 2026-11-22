"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Menu, ShieldCheck, X } from "lucide-react";
import { primaryNav } from "@/content/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const COMPANIES = [
  { slug: "jallal-tech", name: "Jallal Tech", description: "Enterprise IT, software engineering and data infrastructure", icon: "layers", href: "/companies/jallal-tech" },
  { slug: "elevate-360", name: "Elevate 360", description: "Business growth, operational scaling and digital presence", icon: "trending-up", href: "/companies/elevate-360" },
  { slug: "jallal-institute-of-technology", name: "Jallal Institute of Technology", description: "Technical education, digital skills and talent development", icon: "graduation-cap", href: "/companies/jallal-institute-of-technology" },
  { slug: "jallal-properties-group", name: "Jallal Properties Group", description: "Real estate, land diligence and commercial property", icon: "building", href: "/companies/jallal-properties-group" },
];

interface NavItemProps {
  item: { label: string; href: string };
  isActive: boolean;
  onToggle?: () => void;
  isCompanies?: boolean;
  isOpen?: boolean;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function NavItem({ item, isActive, onToggle, isCompanies, isOpen, isHovered, onMouseEnter, onMouseLeave }: NavItemProps) {
  return (
    <>
      {isCompanies && onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label="Companies submenu"
          className={cn(
            "relative flex items-center gap-2 py-2 text-body-md transition-colors",
            (isActive || isOpen || isHovered)
              ? "font-semibold text-ink"
              : "text-muted hover:text-ink",
          )}
        >
          {item.label}
          <ChevronDown className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200",
            isOpen && "rotate-180",
          )} />
        </button>
      ) : (
        <Link
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "relative flex items-center gap-2 py-2 text-body-md transition-colors",
            isActive
              ? "font-semibold text-ink"
              : "text-muted hover:text-ink",
          )}
        >
          {item.label}
          {item.label === "Companies" && (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200" />
          )}
        </Link>
      )}
    </>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [companiesOpen, setCompaniesOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const companiesRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setCompaniesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Escape key closes mobile menu and dropdown
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setCompaniesOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Body scroll lock for mobile menu
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Keyboard navigation for Companies dropdown
  useEffect(() => {
    if (!companiesOpen || !companiesRef.current) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        return;
      }
      if (event.key === "Escape") {
        setCompaniesOpen(false);
        return;
      }
      const links = companiesRef.current!.querySelectorAll<HTMLAnchorElement>("a");
      const currentIndex = Array.from(links).indexOf(
        document.activeElement as HTMLAnchorElement
      );
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = (currentIndex + 1) % links.length;
        links[next]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = (currentIndex - 1 + links.length) % links.length;
        links[prev]?.focus();
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        (document.activeElement as HTMLElement)?.click();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [companiesOpen]);

  return (
    <header ref={navRef} className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-white/90 backdrop-blur-md">
      <div className="page-container flex h-20 items-center justify-between gap-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3 focus-visible:outline-none"
            aria-label="Jallal Group — home"
          >
              <Image
                src="/images/logo.png"
                alt="Jallal Group"
                width={48}
                height={48}
                priority
                className="h-12 w-12 object-contain"
              />
          </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex xl:gap-9">
          {primaryNav.map((item) => {
            const active = isActive(item.href);
            const isCompanies = item.label === "Companies";
            return (
              <div
                key={item.href}
                className="relative"
              >
                <NavItem
                  item={item}
                  isActive={active}
                  onToggle={() => setCompaniesOpen((v) => !v)}
                  isCompanies={isCompanies}
                  isOpen={companiesOpen}
                  isHovered={hovered}
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                />
                {isCompanies && (
                  <CompaniesDropdown
                    open={companiesOpen || hovered}
                    onClose={() => setCompaniesOpen(false)}
                    ref={companiesRef}
                  />
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            href="/partnerships#inquiry"
            size="sm"
            className="hidden sm:inline-flex btn-press"
          >
            Partner with us
          </Button>

          <Link
            href="/admin/login"
            title="Team login"
            aria-label="Team login"
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-forest sm:flex focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <ShieldCheck className="h-4 w-4" />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-line text-ink transition-colors hover:bg-sunken lg:hidden focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-navigation"
          className="border-t border-line bg-white lg:hidden"
        >
          <nav aria-label="Mobile" className="page-container flex flex-col py-4">
            {primaryNav.map((item) => {
              const active = isActive(item.href);
              if (item.label === "Companies") {
                return (
                  <div key={item.href} className="relative">
                    <button
                      type="button"
                      onClick={() => setCompaniesOpen((v) => !v)}
                      aria-expanded={companiesOpen}
                      aria-label="Companies submenu"
                      className="flex w-full items-center justify-between border-b border-line/70 py-4 text-body-lg transition-colors"
                    >
                      <span className={cn(
                        "font-semibold transition-colors",
                        active ? "text-ink" : "text-muted",
                      )}>
                        {item.label}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          companiesOpen ? "rotate-180" : "",
                        )}
                      />
                    </button>
                    {companiesOpen && (
                      <MobileCompaniesList onClose={() => { setCompaniesOpen(false); setOpen(false); }} />
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "border-b border-line/70 py-4 text-body-lg transition-colors",
                    active ? "font-semibold text-ink" : "text-muted",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-3 pt-5">
              <Button href="/partnerships#inquiry" size="md" onClick={() => setOpen(false)}>
                Partner with us
              </Button>
              <Button
                href="/admin/login"
                variant="secondary"
                size="md"
                onClick={() => setOpen(false)}
              >
                Team login
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

function CompaniesDropdown({ open, onClose, ref }: { open: boolean; onClose: () => void; ref: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed top-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-[900px] rounded-lg border border-line bg-white shadow-overlay",
        open
          ? "opacity-100 translate-y-0 pointer-events-auto transition-opacity duration-200 ease-out transition-transform duration-200"
          : "opacity-0 -translate-y-2 pointer-events-none transition-opacity duration-200 ease-in transition-transform duration-200",
      )}
    >
      <div className="page-container flex flex-col gap-0 p-6 lg:p-8">
        <div className="flex flex-col gap-1">
          <span className="label-caps text-muted">Operating subsidiaries</span>
          <h2 className="text-headline-md font-bold tracking-tight text-ink">
            Our companies
          </h2>
          <p className="mt-1 text-body-sm leading-relaxed text-muted">
            Four distinct enterprises driving modernisation across key economic sectors.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-0 md:grid-cols-2 border-t border-line pt-6">
          {COMPANIES.map((company) => (
            <Link
              key={company.slug}
              href={company.href}
              onClick={onClose}
              className="flex items-center gap-4 border-b border-line/60 py-4 px-2 transition-colors hover:bg-surface/50 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-surface/50 last:border-b-0"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-accent">
                <Icon name={company.icon} className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-ink truncate">{company.name}</span>
                <span className="text-label-sm text-muted truncate">{company.description}</span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
          <span className="text-body-sm text-muted">
            View all subsidiaries
          </span>
          <Link
            href="/companies"
            className="inline-flex items-center gap-1 text-body-sm font-semibold text-ink transition-colors hover:text-accent"
          >
            Explore portfolio
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileCompaniesList({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4 mb-4">
      <span className="label-caps text-muted pl-1">Subsidiaries</span>
      {COMPANIES.map((company) => (
        <Link
          key={company.slug}
          href={company.href}
          onClick={onClose}
          className="flex items-center gap-3 border-b border-line/60 py-3 px-2 text-body-md text-muted hover:bg-surface hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <Icon name={company.icon} className="h-5 w-5 text-accent shrink-0" />
          <span className="font-medium">{company.name}</span>
        </Link>
      ))}
    </div>
  );
}

function Icon({ name, className }: { name: string; className?: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    "trending-up": <svg className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 7l7 7m0 0-7 7m7-7-3-3M3 16l3-3m0 0-3 3m3-3-3-3"></path></svg>,
    "graduation-cap": <svg className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-1.353 3-3m0 0c0-1.648-.13-3.287-.358-4.872m0 10.48a8.965 8.965 0 01-2.172-5.728m0 0a8.965 8.965 0 000-7.856m0 0a8.965 8.965 0 014.334-2.673m0 0a8.965 8.965 0 000-15.714m0 0a8.965 8.965 0 01-5.775 2.088m0 0a8.965 8.965 0 00-5.775-2.088m0 0a8.965 8.965 0 01-4.334 2.673m0 0a8.965 8.965 0 000 7.856m0 0a8.965 8.965 0 01-2.172 5.728m0 0c0 1.648.13 3.287.358 4.872m0 0a8.965 8.965 0 002.172 5.728m0 0a8.965 8.965 0 012.172-5.728m0 0c0-1.648-.13-3.287-.358-4.872m0 0a8.965 8.965 0 00-4.334-2.673m0 0a8.965 8.965 0 014.334-2.673m0 0a8.965 8.965 0 000 7.856m0 0a8.965 8.965 0 012.172 5.728m0 0a8.965 8.965 0 000 7.856m0 0a8.965 8.965 0 012.172-5.728"></path></svg>,
    building: <svg className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>,
    layers: <svg className={cn("h-5 w-5", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>,
  };
  return iconMap[name] ?? <span>{name}</span>;
}
