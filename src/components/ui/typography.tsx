import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Eyebrow({
  children,
  tone = "dark",
  className,
}: {
  children: ReactNode;
  tone?: "dark" | "light" | "muted";
  className?: string;
}) {
  const toneClass =
    tone === "light"
      ? "text-lime"
      : tone === "muted"
        ? "text-muted"
        : "text-accent";

  return (
    <span
      className={cn(
        "label-caps inline-flex items-center gap-2",
        toneClass,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-px w-6",
          tone === "light" ? "bg-lime" : tone === "muted" ? "bg-line-strong" : "bg-accent",
        )}
      />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  tone = "dark",
  className,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "start" | "center";
  tone?: "dark" | "light";
  className?: string;
  actions?: ReactNode;
}) {
  const light = tone === "light";

  return (
    <div
      className={cn(
        "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
        align === "center" && "items-center text-center lg:flex-col lg:items-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex max-w-3xl flex-col gap-4",
          align === "center" && "items-center",
        )}
      >
        {eyebrow ? (
          <Eyebrow tone={light ? "light" : "dark"}>{eyebrow}</Eyebrow>
        ) : null}
        <h2
          className={cn(
            "text-display-md font-bold tracking-tight lg:text-display-lg",
            light ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "max-w-2xl text-body-lg leading-relaxed",
              light ? "text-on-dark-muted" : "text-muted",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
