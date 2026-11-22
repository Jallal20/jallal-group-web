"use client";

import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const controlClass =
  "w-full rounded-md border border-line bg-white px-3.5 py-2.5 text-body-md text-ink placeholder:text-muted/60 transition-colors focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-sunken disabled:text-muted";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="label-caps flex items-center gap-1 text-ink"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="text-danger">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-body-sm text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-body-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      className={cn(
        controlClass,
        invalid && "border-danger focus:border-danger focus:ring-danger/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      className={cn(
        controlClass,
        "min-h-32 resize-y",
        invalid && "border-danger focus:border-danger focus:ring-danger/20",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      className={cn(
        controlClass,
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%23556057%22 stroke-width=%222%22><path d=%22M4 6l4 4 4-4%22/></svg>')] bg-[length:16px_16px] bg-[right_0.75rem_center] bg-no-repeat pr-10",
        invalid && "border-danger focus:border-danger focus:ring-danger/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
