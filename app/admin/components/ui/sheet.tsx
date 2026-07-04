"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn("ad-anim-in fixed inset-0 z-[200] bg-slate-950/40 backdrop-blur-[2px]", className)}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  width = "420px",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: "right" | "left"; width?: string }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        style={{ width, [side]: 0 } as React.CSSProperties}
        className={cn(
          "ad-anim-panel fixed top-0 z-[201] h-full max-w-full overflow-y-auto border-[var(--ad-border)] bg-[var(--ad-surface)] p-6 text-[var(--ad-text)] shadow-[var(--ad-shadow-lg)] focus:outline-none",
          side === "right" ? "border-l" : "border-r",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-[var(--ad-text-muted)] transition-colors hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]">
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-5 space-y-1", className)} {...props} />;
}
function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-base font-semibold text-[var(--ad-text)]", className)} {...props} />;
}
function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm text-[var(--ad-text-secondary)]", className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription };
