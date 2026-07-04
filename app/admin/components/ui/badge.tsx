import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]",
        neutral: "bg-[var(--ad-surface-hover)] text-[var(--ad-text-secondary)]",
        success: "bg-[var(--ad-success-soft)] text-[var(--ad-success-text)]",
        warning: "bg-[var(--ad-warning-soft)] text-[var(--ad-warning-text)]",
        danger: "bg-[var(--ad-danger-soft)] text-[var(--ad-danger-text)]",
        outline: "border border-[var(--ad-border)] text-[var(--ad-text-secondary)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
