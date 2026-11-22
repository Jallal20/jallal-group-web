import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "accent" | "ghost" | "danger" | "icon";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-bold uppercase tracking-[0.1em] text-[11px] leading-4 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-white hover:bg-forest shadow-sm hover:shadow-raised",
  secondary:
    "bg-white text-ink border border-line hover:border-ink hover:bg-sunken",
  outline:
    "bg-transparent text-ink border border-ink/25 hover:border-ink hover:bg-ink hover:text-white",
  accent:
    "bg-lime text-ink hover:bg-accent hover:text-white",
  ghost:
    "bg-transparent text-ink hover:bg-sunken",
  danger:
    "bg-danger text-white hover:bg-danger/90",
  icon:
    "bg-transparent text-ink hover:bg-sunken p-2",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4",
  md: "h-11 px-6",
  lg: "h-12 px-7",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonProps = BaseProps &
  Omit<ComponentProps<"button">, "className" | "children"> & { href?: undefined };

type LinkProps = BaseProps & { href: string } & Omit<
    ComponentProps<typeof Link>,
    "className" | "children" | "href"
  >;

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps | LinkProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as LinkProps;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...rest } = props as ButtonProps;
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
