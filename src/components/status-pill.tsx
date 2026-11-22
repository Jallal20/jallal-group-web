import type { VentureStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const styles: Record<VentureStatus, string> = {
  "In development": "bg-success-soft text-success",
  Prototyping: "bg-sunken text-muted",
  Architecture: "bg-sunken text-muted",
  Research: "bg-sunken text-muted",
};

const dots: Record<VentureStatus, string> = {
  "In development": "bg-accent",
  Prototyping: "bg-line-strong",
  Architecture: "bg-line-strong",
  Research: "bg-line-strong",
};

export function StatusPill({
  status,
  className,
}: {
  status: VentureStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm font-medium",
        styles[status],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dots[status])} />
      {status}
    </span>
  );
}
