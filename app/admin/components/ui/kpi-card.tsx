"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Minus, Info, type LucideIcon } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./tooltip";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

const TINTS = {
  accent: { fg: "var(--ad-accent)", bg: "var(--ad-accent-soft)" },
  success: { fg: "var(--ad-success)", bg: "var(--ad-success-soft)" },
  warning: { fg: "var(--ad-warning)", bg: "var(--ad-warning-soft)" },
  danger: { fg: "var(--ad-danger)", bg: "var(--ad-danger-soft)" },
  purple: { fg: "var(--ad-chart-4)", bg: "rgba(124, 58, 237, 0.12)" },
};

function AnimatedNumber({ value }: { value: string | number }) {
  const [display, setDisplay] = useState<string | number>(typeof value === "number" ? 0 : value);

  useEffect(() => {
    if (typeof value !== "number") { setDisplay(value); return; }
    const target: number = value;
    const duration = 600;
    const start = performance.now();
    const from = 0;
    let raf: number;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{typeof display === "number" ? display.toLocaleString("fr-FR") : display}</>;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  comparisonLabel,
  sparkline,
  tooltip,
  tint = "accent",
  loading,
  className,
  onClick,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: number | null;
  comparisonLabel?: string;
  sparkline?: { x: string | number; y: number }[];
  tooltip?: string;
  tint?: keyof typeof TINTS;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const t = TINTS[tint];
  const trendUp = trend != null && trend > 0;
  const trendFlat = trend != null && trend === 0;

  if (loading) {
    return (
      <div className={cn("rounded-[var(--ad-radius-lg)] border border-[var(--ad-border)] bg-[var(--ad-surface)] p-4", className)}>
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-7 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-[var(--ad-radius-lg)] border border-[var(--ad-border)] bg-[var(--ad-surface)] p-4 shadow-[var(--ad-shadow-xs)] transition-shadow hover:shadow-[var(--ad-shadow-md)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-[var(--ad-radius-sm)]"
              style={{ background: t.bg, color: t.fg }}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ad-text-muted)]">{label}</p>
        </div>
        {tooltip && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 shrink-0 text-[var(--ad-text-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--ad-text)]">
        <AnimatedNumber value={value} />
      </p>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        {trend != null ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold",
              trendFlat ? "text-[var(--ad-text-muted)]" : trendUp ? "text-[var(--ad-success)]" : "text-[var(--ad-danger)]"
            )}
          >
            {trendFlat ? <Minus className="h-3 w-3" /> : trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
            {comparisonLabel && <span className="ml-1 font-normal text-[var(--ad-text-muted)]">{comparisonLabel}</span>}
          </span>
        ) : comparisonLabel ? (
          <span className="text-xs text-[var(--ad-text-muted)]">{comparisonLabel}</span>
        ) : <span />}

        {sparkline && sparkline.length > 1 && (
          <div className="h-6 w-16 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <defs>
                  <linearGradient id={`spark-${label.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={t.fg} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={t.fg} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="y" stroke={t.fg} strokeWidth={1.5} fill={`url(#spark-${label.replace(/\s/g, "")})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
