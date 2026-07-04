import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ad-skeleton rounded-[var(--ad-radius-sm)]", className)} {...props} />;
}

export { Skeleton };
