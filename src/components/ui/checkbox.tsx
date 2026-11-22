"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className, type, checked, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn(
      "h-4 w-4 shrink-0 rounded-md border border-line bg-white text-accent accent-accent focus:border-accent focus:ring-0 disabled:opacity-50 disabled:pointer-events-none",
      className,
    )}
    checked={checked}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
