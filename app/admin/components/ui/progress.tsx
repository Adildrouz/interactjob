import { cn } from "@/lib/utils";

function Progress({
  value,
  className,
  barClassName,
  color,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-[var(--ad-surface-hover)]", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500 ease-out", barClassName)}
        style={{ width: `${pct}%`, background: color || "var(--ad-accent)" }}
      />
    </div>
  );
}

export { Progress };
