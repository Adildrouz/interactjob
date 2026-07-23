"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from "recharts";
import {
  Briefcase, Inbox, Eye, TrendingUp, Target, Building2, Download, RefreshCw, Sparkles,
  Newspaper, Megaphone, ExternalLink, Clock, FileText, Radio, Globe2, Wallet,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./components/ui/card";
import { ChartCard } from "./components/ui/chart-card";
import { KpiCard } from "./components/ui/kpi-card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { StatusDot } from "./components/ui/status-dot";
import { Progress } from "./components/ui/progress";
import { Skeleton } from "./components/ui/skeleton";
import { EmptyState } from "./components/ui/empty-state";

const CHART = {
  accent: "var(--ad-chart-1)",
  success: "var(--ad-chart-2)",
  warning: "var(--ad-chart-3)",
  purple: "var(--ad-chart-4)",
  danger: "var(--ad-chart-5)",
  grid: "var(--ad-chart-grid)",
};

// ── Types (unchanged from the legacy dashboard — same API contracts) ─────────
interface Overview {
  kpi: {
    activeJobs: number;
    applications: { total: number; week: number; prevWeek: number; today: number };
    jobsNew: { week: number; prevWeek: number };
    employersTotal: number;
    employersMonth: number;
    appsMonth: number;
    visitors?: { today: number; week: number; sparkline: { date: string; visitors: number }[] };
    pageViewsOffresMonth?: number;
    conversionRate?: number;
  };
  // Genuinely period-scoped (Auj./7j/30j/Tout) — everything above in `kpi` is
  // current-state/all-time and does NOT move with the date filter.
  period: {
    range: string;
    label: string;
    applications: number;
    applicationsPrev: number | null;
    visitors: number;
    visitorsPrev: number | null;
    pageViews: number;
    pageViewsPrev: number | null;
    conversionRate: number;
    employersNew: number;
    employersNewPrev: number | null;
    sparkline: { date: string; visitors: number }[];
  };
  jobs: {
    sources: { name: string; total: number; active: number; expired: number; lastSync: string; status: string }[];
    scraped: { total: number; active: number; expired: number };
    direct: { id: string; title: string; company: string; city: string; postedAt: string; sponsored: boolean; status: string; slug: string; views: number; applications: number; conversionRate?: number }[];
    enrichment: { done: number; total: number; lastRun: string; estCostUSD: number | null };
  };
  remote: { total: number; sources: Record<string, number>; feeds: { name: string; status: string; reason?: string }[]; lastSync: string };
  seo: { indexableOffres: number; articles: number; lastArticle: string; codeTravail: number; codeTravailFaq: boolean };
  revenue: { month: number; annonces: number; personality: number; history: { month: string; mad: number }[]; target: number };
  topJobs: { job: string; company: string; count: number }[];
  recentActivity?: { type: string; label: string; sub: string; at: string }[];
}

interface Application {
  id: string; job_title: string; company: string;
  applicant_email: string; applicant_name: string;
  cv_url?: string | null;
  status: string; created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function maskEmail(email: string) {
  const [user, domain] = (email || "").split("@");
  if (!domain) return email;
  return `${user[0]}***@${domain}`;
}

function relTime(iso?: string) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `il y a ${Math.max(1, Math.floor(diff / 60))} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

function pctChange(now: number, prev: number): number | null {
  if (prev === 0 && now === 0) return null;
  if (prev === 0) return 100;
  return Math.round(((now - prev) / prev) * 100);
}

const APP_STATUS: Record<string, { label: string; variant: "neutral" | "default" | "danger" | "success" }> = {
  recue: { label: "Reçue", variant: "neutral" },
  vue: { label: "Vue", variant: "default" },
  refusee: { label: "Refusée", variant: "danger" },
  acceptee: { label: "Acceptée", variant: "success" },
};

const RANGES = [
  { key: "today", label: "Auj." },
  { key: "7j", label: "7j" },
  { key: "30j", label: "30j" },
  { key: "all", label: "Tout" },
] as const;

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [ov, setOv] = useState<Overview | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [appMetrics, setAppMetrics] = useState({ total: 0, month: 0, week: 0, today: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobTab, setJobTab] = useState<"rss" | "direct" | "enrich">("rss");
  const [appFilter, setAppFilter] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [dateRange, setDateRange] = useState<"today" | "7j" | "30j" | "all">("all");

  async function load(range = dateRange) {
    try {
      const [ovRes, appsRes] = await Promise.all([
        fetch(`/api/admin/overview?range=${range}`),
        fetch("/api/admin/applications"),
      ]);
      if (ovRes.status === 401) { router.push("/admin/login"); return; }
      if (ovRes.ok) setOv(await ovRes.json());
      else setError("Erreur chargement overview");
      if (appsRes.ok) {
        const d = await appsRes.json();
        setApps(d.applications || []);
        setAppMetrics(d.metrics || { total: 0, month: 0, week: 0, today: 0 });
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function changeRange(r: typeof dateRange) {
    if (r === dateRange) return;
    setDateRange(r);
    setLoading(true);
    load(r);
  }

  async function forceSync(source: string) {
    setSyncing(source);
    try {
      await fetch("https://interactjob-production.up.railway.app/trigger/scrape", { method: "POST" });
    } catch { /* fire and forget */ }
    setTimeout(() => setSyncing(null), 3000);
  }

  async function forceEnrich() {
    setEnriching(true);
    try {
      await fetch("https://interactjob-production.up.railway.app/trigger/enrich", { method: "POST" });
    } catch { /* fire and forget */ }
    setTimeout(() => setEnriching(false), 3000);
  }

  async function setAppStatus(id: string, status: string) {
    await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setApps((a) => a.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  function exportCSV() {
    const rows = [
      ["Candidat", "Email", "Offre", "Entreprise", "Date", "Statut"],
      ...apps.map((a) => [a.applicant_name, a.applicant_email, a.job_title, a.company, a.created_at, a.status]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `candidatures-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const filteredApps = useMemo(
    () => (appFilter ? apps.filter((a) => a.status === appFilter) : apps),
    [apps, appFilter]
  );

  const remoteDonut = useMemo(() => {
    if (!ov) return [];
    return [
      { name: "Offres Maroc", value: ov.kpi.activeJobs },
      { name: "Offres Remote", value: ov.remote.total },
    ];
  }, [ov]);

  const conversionRate = (ov?.period.conversionRate ?? 0).toFixed(1);

  const visitorsSpark = (ov?.period.sparkline ?? []).map((d) => ({ x: d.date, y: d.visitors }));
  const isHourlyChart = dateRange === "today";

  const PERIOD_SUFFIX: Record<typeof dateRange, string> = {
    today: "aujourd'hui",
    "7j": "sur 7j",
    "30j": "sur 30j",
    all: "au total",
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--ad-text)]">Vue d&apos;ensemble</h1>
          <p className="mt-0.5 text-sm text-[var(--ad-text-muted)]">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-[var(--ad-radius-sm)] border border-[var(--ad-border)] bg-[var(--ad-surface)] p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => changeRange(r.key)}
              className={`rounded-[calc(var(--ad-radius-sm)-2px)] px-3 py-1.5 text-xs font-semibold transition-colors ${
                dateRange === r.key
                  ? "bg-[var(--ad-accent)] text-white"
                  : "text-[var(--ad-text-muted)] hover:text-[var(--ad-text)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--ad-radius-md)] border border-[var(--ad-danger)]/30 bg-[var(--ad-danger-soft)] p-3 text-sm text-[var(--ad-danger-text)]">
          {error}
        </div>
      )}

      {/* ── KPI grid ── */}
      {/* "en direct" cards are current-state totals, unaffected by the period filter above.
          "période" cards are fully scoped to the selected Auj./7j/30j/Tout range. */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          loading={loading}
          label="Offres actives"
          badge="en direct"
          value={ov?.kpi.activeJobs ?? 0}
          icon={Briefcase}
          trend={pctChange(ov?.kpi.jobsNew.week ?? 0, ov?.kpi.jobsNew.prevWeek ?? 0)}
          comparisonLabel="vs 7j préc."
          tooltip="Nombre total d'offres actives, toutes sources confondues — total courant, non affecté par le filtre de période."
        />
        <KpiCard
          loading={loading}
          label="Candidatures"
          badge="période"
          value={ov?.period.applications ?? 0}
          icon={Inbox}
          trend={pctChange(ov?.period.applications ?? 0, ov?.period.applicationsPrev ?? 0)}
          comparisonLabel={ov?.period.applicationsPrev != null ? "vs période préc." : ov?.period.label}
          tint="success"
          tooltip={`Candidatures reçues via /api/apply et le Talent Pool — ${ov?.period.label.toLowerCase() ?? ""}.`}
        />
        <KpiCard
          loading={loading}
          label={dateRange === "today" ? "Visiteurs aujourd'hui" : `Visiteurs (${ov?.period.label.toLowerCase() ?? ""})`}
          badge="période"
          value={ov?.period.visitors ?? 0}
          icon={Eye}
          trend={pctChange(ov?.period.visitors ?? 0, ov?.period.visitorsPrev ?? 0)}
          comparisonLabel={ov?.period.visitorsPrev != null ? "vs période préc." : "historique complet"}
          sparkline={visitorsSpark}
          tint="purple"
        />
        <KpiCard
          loading={loading}
          label={`Vues offres (${ov?.period.label.toLowerCase() ?? "période"})`}
          badge="période"
          value={ov?.period.pageViews ?? 0}
          icon={TrendingUp}
          comparisonLabel="pages /offres/*"
        />
        <KpiCard
          loading={loading}
          label="Conversion"
          badge="période"
          value={`${conversionRate}%`}
          icon={Target}
          comparisonLabel="candid. / vues"
          tint="warning"
          tooltip={`Candidatures divisées par les vues des pages offres — ${ov?.period.label.toLowerCase() ?? ""}.`}
        />
        <KpiCard
          loading={loading}
          label="Employeurs inscrits"
          badge="en direct"
          value={ov?.kpi.employersTotal ?? 0}
          icon={Building2}
          comparisonLabel={`+${ov?.period.employersNew ?? 0} ${PERIOD_SUFFIX[dateRange]}`}
          tint="success"
          onClick={() => router.push("/admin/employeurs")}
          tooltip="Total d'employeurs inscrits — total courant. Le delta ci-dessous suit la période sélectionnée."
        />
      </div>

      {/* ── Progression croissance — stratégie gratuit-d'abord ──
          Rappel visuel : la monétisation employeurs ne s'active que quand
          ces seuils sont atteints. Seuils provisoires, à ajuster. */}
      <div className="rounded-[var(--ad-radius-md)] border border-[var(--ad-border)] bg-[var(--ad-surface)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[var(--ad-text)]">🌱 Progression croissance (gratuit-d&apos;abord)</h3>
          <span className="text-[11px] text-[var(--ad-text-muted)]">Monétisation employeurs quand les seuils sont atteints — seuils provisoires</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Candidatures", value: ov?.kpi.applications.total ?? 0, target: 2000 },
            { label: "Offres actives", value: ov?.kpi.activeJobs ?? 0, target: 1000 },
            { label: `Visiteurs (${ov?.period.label ?? "période"})`, value: ov?.period.visitors ?? 0, target: 50000 },
          ].map((g) => {
            const pct = Math.min(100, Math.round((g.value / g.target) * 100));
            const done = pct >= 100;
            return (
              <div key={g.label}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--ad-text)]">{g.label}</span>
                  <span className="text-[11px] text-[var(--ad-text-muted)] tabular-nums">
                    {g.value.toLocaleString("fr-FR")} / {g.target.toLocaleString("fr-FR")} · {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--ad-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: done ? "var(--ad-success)" : "#00C2CB" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        {/* ════ MAIN COLUMN ════ */}
        <div className="min-w-0 space-y-6">

          {/* Visitors trend — reflects the selected period filter (hourly for
              Aujourd'hui since visitor_days only tracks daily granularity). */}
          <ChartCard title="Visiteurs uniques" description={ov?.period.label ?? "7 derniers jours"}>
            {loading ? (
              <Skeleton className="h-[140px] w-full" />
            ) : visitorsSpark.length > 1 ? (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={visitorsSpark} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.accent} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={CHART.accent} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis
                    dataKey="x"
                    tick={{ fontSize: 11, fill: "var(--ad-text-muted)" }}
                    tickFormatter={(d: string) => (isHourlyChart ? d : d.slice(5))}
                    axisLine={false}
                    tickLine={false}
                    interval={isHourlyChart ? 2 : "preserveStartEnd"}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "var(--ad-text-muted)" }} width={30} axisLine={false} tickLine={false} />
                  <RTooltip contentStyle={{ background: "var(--ad-surface)", border: "1px solid var(--ad-border)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="y" stroke={CHART.accent} strokeWidth={2} fill="url(#visitorsFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Eye} title="Pas encore de données" description="Le tracking visiteurs s'affichera ici dès les premières visites." />
            )}
          </ChartCard>

          {/* Jobs segmentation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Sources d&apos;offres</CardTitle>
              <div className="inline-flex items-center gap-1 rounded-[var(--ad-radius-md)] bg-[var(--ad-surface-hover)] p-1">
                {([
                  ["rss", "RSS / Scrapées"],
                  ["direct", "Directes"],
                  ["enrich", "Enrichies"],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setJobTab(key)}
                    className={`rounded-[calc(var(--ad-radius-md)-4px)] px-3.5 py-1.5 text-sm font-medium transition-all ${
                      jobTab === key
                        ? "bg-[var(--ad-surface)] text-[var(--ad-text)] shadow-[var(--ad-shadow-xs)]"
                        : "text-[var(--ad-text-secondary)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
                {jobTab === "rss" && (
                <div className="mt-0 space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {ov?.jobs.sources.map((s) => (
                      <div key={s.name} className="rounded-[var(--ad-radius-md)] border border-[var(--ad-border)] p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm font-semibold text-[var(--ad-text)]">{s.name}</p>
                          <StatusDot status={s.status as "ok" | "warn" | "error" | "broken"} />
                        </div>
                        <p className="text-2xl font-bold text-[var(--ad-text)]">{s.active}</p>
                        <p className="text-xs text-[var(--ad-text-muted)]">
                          actives · {s.expired} expirées · sync {relTime(s.lastSync)}
                        </p>
                        <Button
                          size="sm" variant="secondary" className="mt-3 gap-1.5"
                          onClick={() => forceSync(s.name)} disabled={syncing === s.name}
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${syncing === s.name ? "animate-spin" : ""}`} />
                          {syncing === s.name ? "Sync lancée" : "Forcer la sync"}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-5 border-t border-[var(--ad-border-subtle)] pt-3 text-sm">
                    <span className="text-[var(--ad-text-muted)]">Total : <b className="text-[var(--ad-text)]">{ov?.jobs.scraped.total}</b></span>
                    <span className="text-[var(--ad-success)]">Actives : <b>{ov?.jobs.scraped.active}</b></span>
                    <span className="text-[var(--ad-text-muted)]">Expirées : <b>{ov?.jobs.scraped.expired}</b></span>
                  </div>
                </div>
                )}

                {jobTab === "direct" && (
                <div className="mt-0">
                  {(ov?.jobs.direct.length ?? 0) === 0 ? (
                    <EmptyState icon={Briefcase} title="Aucune offre directe active" />
                  ) : (
                    <div className="-mx-5 overflow-x-auto px-5">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--ad-border)] text-left text-xs text-[var(--ad-text-muted)]">
                            <th className="py-2 pr-3 font-medium">Titre</th>
                            <th className="py-2 pr-3 font-medium">Ville</th>
                            <th className="py-2 pr-3 font-medium">Date</th>
                            <th className="py-2 pr-3 font-medium">Vues</th>
                            <th className="py-2 pr-3 font-medium">Candid.</th>
                            <th className="py-2 pr-3 font-medium">Taux</th>
                            <th className="py-2 pr-3 font-medium" />
                            <th className="py-2 font-medium" />
                          </tr>
                        </thead>
                        <tbody>
                          {ov?.jobs.direct.map((j) => (
                            <tr key={j.id} className="border-b border-[var(--ad-border-subtle)] transition-colors hover:bg-[var(--ad-surface-hover)]">
                              <td className="max-w-[200px] truncate py-2.5 pr-3 font-medium text-[var(--ad-text)]">{j.title}</td>
                              <td className="py-2.5 pr-3 text-[var(--ad-text-muted)]">{j.city}</td>
                              <td className="whitespace-nowrap py-2.5 pr-3 text-xs text-[var(--ad-text-muted)]">{relTime(j.postedAt)}</td>
                              <td className="py-2.5 pr-3 font-semibold text-[var(--ad-text)]">{j.views}</td>
                              <td className="py-2.5 pr-3 font-semibold text-[var(--ad-accent)]">{j.applications}</td>
                              <td className="py-2.5 pr-3 text-xs text-[var(--ad-text-muted)]">{j.views > 0 ? `${(j.conversionRate ?? 0).toFixed(1)}%` : "—"}</td>
                              <td className="py-2.5 pr-3">{j.sponsored && <Badge variant="success">Sponsorisée</Badge>}</td>
                              <td className="py-2.5">
                                <div className="flex gap-3">
                                  <Link href={`/admin/offres/${j.id}`} className="text-xs font-medium text-[var(--ad-accent)] hover:underline">Stats</Link>
                                  <a href={`/offres/${j.slug}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--ad-text-muted)] hover:underline">Voir</a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                )}

                {jobTab === "enrich" && (
                <div className="mt-0 space-y-4">
                  {ov && (
                    <>
                      <div>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span className="text-[var(--ad-text)]">
                            Analyses RH remplies : <b>{ov.jobs.enrichment.done}</b> / {ov.jobs.enrichment.total}
                          </span>
                          <span className="text-[var(--ad-text-muted)]">
                            {Math.round((ov.jobs.enrichment.done / Math.max(1, ov.jobs.enrichment.total)) * 100)}%
                          </span>
                        </div>
                        <Progress value={(ov.jobs.enrichment.done / Math.max(1, ov.jobs.enrichment.total)) * 100} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-[var(--ad-radius-md)] border border-[var(--ad-border)] p-3">
                          <p className="text-xs text-[var(--ad-text-muted)]">Dernier enrichissement</p>
                          <p className="font-semibold text-[var(--ad-text)]">{ov.jobs.enrichment.lastRun ? relTime(ov.jobs.enrichment.lastRun) : "—"}</p>
                        </div>
                        <div className="rounded-[var(--ad-radius-md)] border border-[var(--ad-border)] p-3">
                          <p className="text-xs text-[var(--ad-text-muted)]">Coût Claude Haiku cumulé</p>
                          <p className="font-semibold text-[var(--ad-text)]">{ov.jobs.enrichment.estCostUSD != null ? `$${ov.jobs.enrichment.estCostUSD}` : "—"}</p>
                        </div>
                      </div>
                      <Button onClick={forceEnrich} disabled={enriching} className="gap-1.5">
                        <Sparkles className={`h-4 w-4 ${enriching ? "animate-pulse" : ""}`} />
                        {enriching ? "Enrichissement lancé" : "Enrichir les offres manquantes"}
                      </Button>
                    </>
                  )}
                </div>
                )}
            </CardContent>
          </Card>

          {/* Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Candidatures</CardTitle>
              <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-6">
                {[["Ce mois", appMetrics.month], ["Cette semaine", appMetrics.week], ["Aujourd'hui", appMetrics.today], ["Total", appMetrics.total]].map(([label, val]) => (
                  <div key={label as string}>
                    <p className="text-xl font-bold text-[var(--ad-text)]">{val}</p>
                    <p className="text-xs text-[var(--ad-text-muted)]">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setAppFilter(null)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${appFilter === null ? "bg-[var(--ad-accent)] text-white" : "border border-[var(--ad-border)] text-[var(--ad-text-secondary)] hover:bg-[var(--ad-surface-hover)]"}`}
                >
                  Toutes
                </button>
                {Object.entries(APP_STATUS).map(([key, s]) => (
                  <button
                    key={key}
                    onClick={() => setAppFilter(key)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${appFilter === key ? "bg-[var(--ad-accent)] text-white" : "border border-[var(--ad-border)] text-[var(--ad-text-secondary)] hover:bg-[var(--ad-surface-hover)]"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {filteredApps.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="Aucune candidature par offre enregistrée"
                  description="Le tracking est actif via /api/apply — les candidatures Talent Pool restent dans l'onglet Talent Pool."
                  action={<Link href="/admin/candidats" className="text-xs font-medium text-[var(--ad-accent)] hover:underline">Aller au Talent Pool →</Link>}
                />
              ) : (
                <div className="-mx-5 overflow-x-auto px-5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--ad-border)] text-left text-xs text-[var(--ad-text-muted)]">
                        <th className="py-2 pr-3 font-medium">Candidat</th>
                        <th className="py-2 pr-3 font-medium">Offre</th>
                        <th className="py-2 pr-3 font-medium">Date</th>
                        <th className="py-2 pr-3 font-medium">Statut</th>
                        <th className="py-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.slice(0, 50).map((a) => {
                        const st = APP_STATUS[a.status] || APP_STATUS.recue;
                        return (
                          <tr key={a.id} className="border-b border-[var(--ad-border-subtle)] transition-colors hover:bg-[var(--ad-surface-hover)]">
                            <td className="py-2.5 pr-3">
                              <p className="font-medium text-[var(--ad-text)]">{a.applicant_name || "—"}</p>
                              <p className="text-xs text-[var(--ad-text-muted)]">{maskEmail(a.applicant_email)}</p>
                            </td>
                            <td className="max-w-[180px] py-2.5 pr-3 text-[var(--ad-text)]">
                              <span className="block truncate">{a.job_title}</span>
                              {a.cv_url && <a href={a.cv_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--ad-accent)] hover:underline">Voir CV</a>}
                            </td>
                            <td className="whitespace-nowrap py-2.5 pr-3 text-xs text-[var(--ad-text-muted)]">{relTime(a.created_at)}</td>
                            <td className="py-2.5 pr-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                            <td className="py-2.5">
                              <select
                                value={a.status}
                                onChange={(e) => setAppStatus(a.id, e.target.value)}
                                className="rounded-[var(--ad-radius-sm)] border border-[var(--ad-border)] bg-[var(--ad-surface)] px-1.5 py-1 text-xs text-[var(--ad-text)]"
                              >
                                {Object.entries(APP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {(ov?.topJobs.length ?? 0) > 0 && (
                <div className="mt-5 border-t border-[var(--ad-border-subtle)] pt-4">
                  <p className="mb-2 text-sm font-semibold text-[var(--ad-text)]">Top 5 offres les plus candidatées</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={ov!.topJobs} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="job" width={180} tick={{ fontSize: 11, fill: "var(--ad-text-muted)" }} axisLine={false} tickLine={false} />
                      <RTooltip contentStyle={{ background: "var(--ad-surface)", border: "1px solid var(--ad-border)", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill={CHART.accent} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Remote jobs */}
          <Card>
            <CardHeader><CardTitle>Remote Jobs — interactjob.com</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 pt-0 md:grid-cols-2">
              <div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={remoteDonut} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      <Cell fill={CHART.accent} />
                      <Cell fill={CHART.success} />
                    </Pie>
                    <RTooltip contentStyle={{ background: "var(--ad-surface)", border: "1px solid var(--ad-border)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs text-[var(--ad-text-secondary)]">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.accent }} /> Maroc ({ov?.kpi.activeJobs})</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.success }} /> Remote ({ov?.remote.total})</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ad-text-muted)]">Sources RSS remote</p>
                {ov?.remote.feeds.map((f) => {
                  const count = ov.remote.sources[f.name] || 0;
                  return (
                    <div key={f.name} className="flex items-center justify-between border-b border-[var(--ad-border-subtle)] py-1.5">
                      <div>
                        <span className="text-sm font-medium text-[var(--ad-text)]">{f.name}</span>
                        {f.reason && <p className="text-[10px] text-[var(--ad-text-muted)]">{f.reason}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {count > 0 && <span className="text-sm font-semibold text-[var(--ad-text)]">{count}</span>}
                        <StatusDot status={f.status as "ok" | "warn" | "error" | "broken"} />
                      </div>
                    </div>
                  );
                })}
                <p className="pt-1 text-xs text-[var(--ad-text-muted)]">Dernière sync : {relTime(ov?.remote.lastSync)}</p>
              </div>
            </CardContent>
          </Card>

          {/* SEO health */}
          <Card>
            <CardHeader><CardTitle>SEO &amp; santé du contenu</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pt-0 md:grid-cols-4">
              {[
                { label: "Offres indexables", value: ov?.seo.indexableOffres ?? 0, status: "ok" as const },
                { label: "Articles blog", value: ov?.seo.articles ?? 0, status: "ok" as const, sub: ov?.seo.lastArticle ? `dernier : ${relTime(ov.seo.lastArticle)}` : "" },
                { label: "Code du Travail", value: `${ov?.seo.codeTravail ?? 70} articles`, status: "ok" as const, sub: "FAQ schema ✓" },
                { label: "AdSense", value: "Review en attente", status: "warn" as const },
              ].map((s, i) => (
                <div key={i} className="rounded-[var(--ad-radius-md)] border border-[var(--ad-border)] p-3">
                  <div className="mb-1"><StatusDot status={s.status} label={s.label} /></div>
                  <p className={s.label === "AdSense" ? "text-sm font-semibold text-[var(--ad-text)]" : "text-xl font-bold text-[var(--ad-text)]"}>{s.value}</p>
                  {s.sub && <p className="mt-0.5 text-[10px] text-[var(--ad-text-muted)]">{s.sub}</p>}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Revenue */}
          <Card>
            <CardHeader>
              <CardTitle>Revenus</CardTitle>
              <p className="text-3xl font-bold tracking-tight text-[var(--ad-text)]">
                {(ov?.revenue.month ?? 0).toLocaleString("fr-FR")} <span className="text-base font-medium text-[var(--ad-text-muted)]">MAD</span>
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[var(--ad-text-muted)]">Objectif mensuel : {(ov?.revenue.target ?? 0).toLocaleString("fr-FR")} MAD</span>
                  <span className="font-semibold text-[var(--ad-text)]">
                    {Math.min(100, Math.round(((ov?.revenue.month ?? 0) / Math.max(1, ov?.revenue.target ?? 1)) * 100))}%
                  </span>
                </div>
                <Progress value={((ov?.revenue.month ?? 0) / Math.max(1, ov?.revenue.target ?? 1)) * 100} color={CHART.success} />
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {[["Sponsorisée", ov?.revenue.annonces ?? 0], ["Test Personnalité", ov?.revenue.personality ?? 0]].map(([label, val]) => (
                  <Badge key={label as string} variant="neutral">{label} · {(val as number).toLocaleString("fr-FR")} MAD</Badge>
                ))}
              </div>

              {(ov?.revenue.history.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={ov!.revenue.history} margin={{ left: 0, right: 10, top: 5 }}>
                    <CartesianGrid stroke={CHART.grid} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--ad-text-muted)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--ad-text-muted)" }} width={45} axisLine={false} tickLine={false} />
                    <RTooltip contentStyle={{ background: "var(--ad-surface)", border: "1px solid var(--ad-border)", borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="mad" stroke={CHART.accent} strokeWidth={2} dot={{ fill: CHART.accent, r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={Wallet} title="Historique vide" description="Les paiements complétés apparaîtront ici mois par mois." />
              )}
            </CardContent>
          </Card>
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div className="space-y-5 xl:sticky xl:top-20 xl:h-fit">
          <Card>
            <CardHeader><CardTitle>Actions rapides</CardTitle></CardHeader>
            <CardContent className="space-y-1 pt-0">
              {[
                { label: "Forcer enrichissement Haiku", icon: Sparkles, onClick: forceEnrich },
                { label: "Publier un article blog", icon: Newspaper, href: "/admin/blog" },
                { label: "Ajouter une offre manuelle", icon: Briefcase, href: "/admin/offres/ajouter" },
                { label: "Marketing employeurs", icon: Megaphone, href: "/admin/marketing" },
                { label: "Logs Railway", icon: Radio, href: "https://railway.app/dashboard", ext: true },
                { label: "Vercel Analytics", icon: TrendingUp, href: "https://vercel.com/analytics", ext: true },
                { label: "Search Console", icon: Globe2, href: "https://search.google.com/search-console", ext: true },
              ].map((a, i) => {
                const content = (
                  <span className="flex w-full items-center gap-2.5 rounded-[var(--ad-radius-sm)] px-2.5 py-2 text-sm font-medium text-[var(--ad-text-secondary)] transition-colors hover:bg-[var(--ad-surface-hover)] hover:text-[var(--ad-text)]">
                    <a.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{a.label}</span>
                    {a.ext && <ExternalLink className="h-3 w-3 shrink-0 text-[var(--ad-text-muted)]" />}
                  </span>
                );
                if (a.onClick) return <button key={i} onClick={a.onClick} className="w-full">{content}</button>;
                if (a.ext) return <a key={i} href={a.href} target="_blank" rel="noreferrer">{content}</a>;
                return <Link key={i} href={a.href!}>{content}</Link>;
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dernière activité</CardTitle></CardHeader>
            <CardContent className="pt-0">
              {(ov?.recentActivity?.length ?? 0) === 0 ? (
                <EmptyState icon={Clock} title="Aucune activité récente" className="py-6" />
              ) : (
                <div className="space-y-3.5">
                  {ov!.recentActivity!.slice(0, 10).map((ev, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ad-accent-soft)] text-[var(--ad-accent)]">
                        {ev.type === "candidature" ? <Inbox className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-[var(--ad-text)]">{ev.label}</p>
                        {ev.sub && <p className="truncate text-[11px] text-[var(--ad-text-muted)]">{ev.sub}</p>}
                        <p className="text-[11px] text-[var(--ad-accent)]">{relTime(ev.at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
