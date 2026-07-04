import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1.5 py-12 px-6 text-center", className)}>
      {Icon && (
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[var(--ad-radius-md)] bg-[var(--ad-surface-hover)] text-[var(--ad-text-muted)]">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-semibold text-[var(--ad-text)]">{title}</p>
      {description && <p className="max-w-sm text-xs text-[var(--ad-text-muted)]">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export { EmptyState };
