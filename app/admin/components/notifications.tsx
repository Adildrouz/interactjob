"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Briefcase, AlertTriangle, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from "./ui/dropdown-menu";
import { EmptyState } from "./ui/empty-state";

interface Notif {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "accent" | "warning" | "danger";
  title: string;
  sub?: string;
  href: string;
}

/** Polls real signals only — pending job approvals + broken data sources. No invented data. */
function useAdminNotifications() {
  const [notifs, setNotifs] = useState<Notif[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [jobsRes, overviewRes] = await Promise.all([
          fetch("/api/admin/jobs"),
          fetch("/api/admin/overview"),
        ]);
        if (cancelled) return;
        const list: Notif[] = [];

        if (jobsRes.ok) {
          const { jobs } = await jobsRes.json();
          if (Array.isArray(jobs) && jobs.length > 0) {
            list.push({
              id: "pending-jobs",
              icon: Briefcase,
              tone: "accent",
              title: `${jobs.length} offre${jobs.length > 1 ? "s" : ""} en attente d'approbation`,
              sub: jobs[0]?.title ? `Dernière : ${jobs[0].title}` : undefined,
              href: "/admin/offres",
            });
          }
        }

        if (overviewRes.ok) {
          const ov = await overviewRes.json();
          for (const s of ov?.jobs?.sources ?? []) {
            if (s.status !== "ok") {
              list.push({
                id: `source-${s.name}`,
                icon: AlertTriangle,
                tone: s.status === "error" ? "danger" : "warning",
                title: `Source "${s.name}" ${s.status === "error" ? "en erreur" : "nécessite attention"}`,
                sub: "Vérifier la synchronisation",
                href: "/admin",
              });
            }
          }
          for (const f of ov?.remote?.feeds ?? []) {
            if (f.status === "broken") {
              list.push({
                id: `remote-${f.name}`,
                icon: AlertTriangle,
                tone: "danger",
                title: `Flux remote "${f.name}" cassé`,
                sub: f.reason,
                href: "/admin",
              });
            }
          }
          if ((ov?.kpi?.employersMonth ?? 0) > 0) {
            list.push({
              id: "employers-month",
              icon: Building2,
              tone: "accent",
              title: `${ov.kpi.employersMonth} nouvel${ov.kpi.employersMonth > 1 ? "les" : ""} employeur${ov.kpi.employersMonth > 1 ? "s" : ""} ce mois`,
              href: "/admin/employeurs",
            });
          }
        }

        setNotifs(list);
      } catch {
        // best-effort — leave notifications empty rather than show stale/fake data
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return notifs;
}

const TONE_CLS: Record<Notif["tone"], string> = {
  accent: "bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]",
  warning: "bg-[var(--ad-warning-soft)] text-[var(--ad-warning)]",
  danger: "bg-[var(--ad-danger-soft)] text-[var(--ad-danger)]",
};

export function NotificationsMenu() {
  const notifs = useAdminNotifications();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-[var(--ad-radius-sm)] text-[var(--ad-text-secondary)] transition-colors hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ad-accent-ring)]">
        <Bell className="h-4 w-4" />
        {notifs.length > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--ad-danger)] px-1 text-[9px] font-bold text-white">
            {notifs.length}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifs.length === 0 ? (
          <EmptyState title="Tout est calme" description="Aucune alerte pour le moment." className="py-6" />
        ) : (
          <div className="max-h-80 space-y-0.5 overflow-y-auto">
            {notifs.map((n) => (
              <DropdownMenuItem key={n.id} onSelect={() => router.push(n.href)} className="items-start gap-3 py-2.5">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--ad-radius-sm)]", TONE_CLS[n.tone])}>
                  <n.icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-[var(--ad-text)]">{n.title}</span>
                  {n.sub && <span className="block truncate text-xs text-[var(--ad-text-muted)]">{n.sub}</span>}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
