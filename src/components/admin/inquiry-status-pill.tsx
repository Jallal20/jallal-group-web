import type { InquiryStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const styles: Record<InquiryStatus, string> = {
  pending: "bg-warning/15 text-warning",
  reviewed: "bg-accent/10 text-forest",
  responded: "bg-success-soft text-success",
};

const labels: Record<InquiryStatus, string> = {
  pending: "Pending",
  reviewed: "Reviewed",
  responded: "Responded",
};

export function InquiryStatusPill({
  status,
  className,
}: {
  status: InquiryStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm font-medium capitalize",
        styles[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {labels[status]}
    </span>
  );
}
