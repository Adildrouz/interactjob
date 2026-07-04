"use client";
import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--ad-radius-sm)] text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ad-accent)] text-white shadow-[var(--ad-shadow-xs)] hover:bg-[var(--ad-accent-hover)]",
        secondary:
          "bg-[var(--ad-surface-hover)] text-[var(--ad-text)] hover:bg-[var(--ad-border)]",
        outline:
          "border border-[var(--ad-border)] bg-[var(--ad-surface)] text-[var(--ad-text)] hover:bg-[var(--ad-surface-hover)]",
        ghost: "text-[var(--ad-text-secondary)] hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)]",
        destructive: "bg-[var(--ad-danger)] text-white hover:opacity-90",
        link: "text-[var(--ad-accent)] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4",
        lg: "h-10 px-5 text-[15px]",
        icon: "h-9 w-9 shrink-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
