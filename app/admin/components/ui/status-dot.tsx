import { cn } from "@/lib/utils";

type Status = "ok" | "warn" | "error" | "broken";

const STATUS_MAP: Record<Status, { color: string; label: string }> = {
  ok: { color: "var(--ad-success)", label: "Actif" },
  warn: { color: "var(--ad-warning)", label: "Attention" },
  error: { color: "var(--ad-danger)", label: "Cassé" },
  broken: { color: "var(--ad-danger)", label: "Cassé" },
};

function StatusDot({ status, label, className }: { status: Status; label?: string; className?: string }) {
  const s = STATUS_MAP[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)} style={{ color: s.color }}>
      <span className="relative flex h-2 w-2">
        {status === "ok" && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
            style={{ background: s.color }}
          />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: s.color }} />
      </span>
      {label ?? s.label}
    </span>
  );
}

export { StatusDot };
