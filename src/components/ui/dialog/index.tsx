"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface DialogContextProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextProps>({
  open: false,
  onOpenChange: () => {},
});

const Dialog = ({ children }: { children: React.ReactNode }) => (
  <DialogContext.Provider value={{ open: false, onOpenChange: () => {} }}>
    {children}
  </DialogContext.Provider>
);

const DialogTrigger = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"button"> & {
    asChild?: boolean;
    onClick?: (() => void) | undefined;
  }
>(({ asChild, onClick, className, children, ...props }, ref) => {
  const ctx = React.useContext(DialogContext);
  const handleClick = () => {
    ctx.onOpenChange(true);
    onClick?.();
  };

  const Comp = asChild ? React.Fragment : ("button" as const);
  return (
    <Comp
      ref={ref as any}
      onClick={handleClick}
      className={cn(className)}
      {...(asChild ? {} : { type: "button", ...props })}
      {...(asChild ? props : {})}
    >
      {children}
    </Comp>
  );
});
DialogTrigger.displayName = "DialogTrigger";

const DialogContent = React.forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  const ctx = React.useContext(DialogContext);
  if (!ctx.open) return null;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") ctx.onOpenChange(false);
  };

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-hidden="true">
      <div
        className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm transition-opacity"
        onClick={() => ctx.onOpenChange(false)}
      />
      <div
        ref={ref}
        className={cn(
          "relative z-50 w-full max-w-lg mx-auto transform rounded-lg border border-line bg-white shadow-overlay",
          className,
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute right-4 top-4">
          <button
            type="button"
            onClick={() => ctx.onOpenChange(false)}
            className="rounded-sm opacity-50 ring-offset-white transition-all hover:bg-accent hover:text-white p-2"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
});
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => (
  <div className={cn("grid gap-1.5 mb-4", className)}>{children}</div>
);

const DialogFooter = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => (
  <div className={cn("mt-6 flex flex-row-reverse gap-2 pt-4 border-t border-line", className)}>
    {children}
  </div>
);

const DialogTitle = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <h2 className={cn("text-headline-sm font-semibold text-ink", className)}>
    {children}
  </h2>
);

const DialogDescription = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => (
  <p className={cn("text-body-sm text-muted", className)}>{children}</p>
);

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
