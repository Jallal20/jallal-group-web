import { cn } from "@/lib/utils";

export function Label({
  className,
  htmlFor,
  children,
}: {
  className?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "label-caps flex items-center gap-1 text-ink",
        className,
      )}
    >
      {children}
    </label>
  );
}
