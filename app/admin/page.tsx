"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";

// ── Brand colors (logo InteractJob) ──────────────────────────────────────────
const C = {
  navy: "#00347A",
  turquoise: "#00C2CB",
  dark: "#001F4D",
  light: "#F0F8FF",
  muted: "#6B8CAE",
  border: "#D0E4F0",
  warn: "#F59E0B",
  err: "#EF4444",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Overview {
  kpi: {
    activeJobs: number;
    applications: { total: number; week: number; prevWeek: number; today: number };
    jobsNew: { week: number; prevWeek: number };
    employersMonth: number;
    appsMonth: number;
    visitors?: { today: number; week: number; sparkline: { date: string; visitors: number }[] };
    pageViewsOffresMonth?: number;
    conversionRate?: number;
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

function Trend({ now, prev }: { now: number; prev: number }) {
  if (prev === 0 && now === 0) return <span className="text-xs" style={{ color: C.muted }}>—</span>;
  const up = now >= prev;
  const pct = prev > 0 ? Math.round(((now - prev) / prev) * 100) : 100;
  return (
    <span className="text-xs font-semibold" style={{ color: up ? C.turquoise : C.err }}>
      {up ? "▲" : "▼"} {Math.abs(pct)}% <span style={{ color: C.muted }}>vs 7j préc.</span>
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === "ok" ? C.turquoise : status === "warn" ? C.warn : C.err;
  const label = status === "ok" ? "Actif" : status === "warn" ? "Attention" : "Cassé";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

const APP_STATUS: Record<string, { label: string; color: string; bold?: boolean }> = {
  recue: { label: "Reçue", color: "#6B8CAE" },
  vue: { label: "Vue", color: "#00C2CB" },
  refusee: { label: "Refusée", color: "#EF4444" },
  acceptee: { label: "Acceptée", color: "#00C2CB", bold: true },
};

// ── Card primitives ───────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl p-5 ${className}`} style={{ border: `1px solid ${C.border}` }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold mb-3" style={{ color: C.dark }}>{children}</h2>;
}

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
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);

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
    setDateRange(r);
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
    setApps(a => a.map(x => (x.id === id ? { ...x, status } : x)));
  }

  function exportCSV() {
    const rows = [
      ["Candidat", "Email", "Offre", "Entreprise", "Date", "Statut"],
      ...apps.map(a => [a.applicant_name, a.applicant_email, a.job_title, a.company, a.created_at, a.status]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `candidatures-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const filteredApps = useMemo(
    () => (appFilter ? apps.filter(a => a.status === appFilter) : apps),
    [apps, appFilter]
  );

  const remoteDonut = useMemo(() => {
    if (!ov) return [];
    return [
      { name: "Offres Maroc", value: ov.kpi.activeJobs },
      { name: "Offres Remote", value: ov.remote.total },
    ];
  }, [ov]);

  // Use real conversion rate from page_views if available, else fallback
  const conversionRate = ov?.kpi.conversionRate != null
    ? ov.kpi.conversionRate.toFixed(1)
    : ov && ov.kpi.activeJobs > 0
      ? ((ov.kpi.appsMonth / Math.max(1, ov.kpi.activeJobs)) * 100).toFixed(1)
      : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: C.muted }}>
        Chargement du tableau de bord…
      </div>
    );
  }

  return (
    <div style={{ background: C.light, margin: "-1rem", padding: "1rem" }} className="md:!-m-6 md:!p-6 min-h-full">

      {/* ── SUMMARY BAR (always visible) ── */}
      <div className="rounded-xl mb-4 overflow-hidden" style={{ background: C.navy }}>
        <div className="flex items-center justify-between flex-wrap gap-2 px-5 py-3 cursor-pointer"
          onClick={() => setSummaryCollapsed(v => !v)}>
          <div className="flex gap-6 flex-wrap text-sm">
            <span className="text-white">
              📋 Offres actives : <b style={{ color: "#7EEAEF" }}>{ov?.kpi.activeJobs ?? "—"}</b>
            </span>
            <span className="text-white">
              📬 Candidatures : <b style={{ color: "#7EEAEF" }}>{ov?.kpi.applications.total ?? "—"}</b>
            </span>
            <span className="text-white">
              👁️ Visiteurs 7j : <b style={{ color: "#7EEAEF" }}>{ov?.kpi.visitors?.week ?? "—"}</b>
            </span>
            <span className="text-white">
              💰 Revenus ce mois : <b style={{ color: "#7EEAEF" }}>{(ov?.revenue.month ?? 0).toLocaleString("fr-FR")} MAD</b>
            </span>
          </div>
          <span className="text-white opacity-60 text-sm">{summaryCollapsed ? "▼ Développer" : "▲ Réduire"}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <h1 className="text-2xl font-bold" style={{ color: C.dark }}>Centre de commande</h1>
        <div className="flex items-center gap-3">
          {/* Date range filter */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            {(["today", "7j", "30j", "all"] as const).map(r => (
              <button key={r} onClick={() => changeRange(r)}
                className="px-3 py-1.5 text-xs font-semibold transition-colors"
                style={dateRange === r
                  ? { background: C.navy, color: "#fff" }
                  : { background: "#fff", color: C.muted }}>
                {r === "today" ? "Auj." : r === "all" ? "Tout" : r}
              </button>
            ))}
          </div>
          <span className="text-sm" style={{ color: C.muted }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#FEF2F2", border: `1px solid ${C.err}`, color: C.err }}>
          {error}
        </div>
      )}

      {!summaryCollapsed && (
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px] gap-5">
        {/* ════ MAIN COLUMN ════ */}
        <div className="space-y-6 min-w-0">

          {/* ── SECTION 1 — KPI BAR ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { icon: "📋", label: "Offres actives", value: ov?.kpi.activeJobs ?? 0,
                trend: <Trend now={ov?.kpi.jobsNew.week ?? 0} prev={ov?.kpi.jobsNew.prevWeek ?? 0} /> },
              { icon: "📬", label: "Candidatures totales", value: ov?.kpi.applications.total ?? 0,
                trend: <Trend now={ov?.kpi.applications.week ?? 0} prev={ov?.kpi.applications.prevWeek ?? 0} /> },
              { icon: "👁️", label: "Visiteurs aujourd'hui", value: ov?.kpi.visitors?.today ?? "—",
                trend: ov?.kpi.visitors?.today != null
                  ? <span className="text-xs" style={{ color: C.muted }}>{ov.kpi.visitors.week} cette semaine</span>
                  : <span className="text-xs" style={{ color: C.muted }}>tracking actif</span> },
              { icon: "📈", label: "Vues offres ce mois", value: ov?.kpi.pageViewsOffresMonth ?? "—",
                trend: <span className="text-xs" style={{ color: C.muted }}>pages /offres/*</span> },
              { icon: "🎯", label: "Taux de conversion", value: `${conversionRate}%`,
                trend: <span className="text-xs" style={{ color: C.muted }}>candid. / vues offres</span> },
              { icon: "🏢", label: "Employeurs ce mois", value: ov?.kpi.employersMonth ?? 0,
                trend: <span className="text-xs" style={{ color: C.muted }}>offres directes</span> },
            ].map((k, i) => (
              <Card key={i} className="!p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: C.turquoise }}>{k.icon}</span>
                  <p className="text-[11px] font-medium uppercase tracking-wide truncate" style={{ color: C.muted }}>{k.label}</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: C.navy }}>{k.value}</p>
                <div className="mt-1">{k.trend}</div>
              </Card>
            ))}
          </div>

          {/* Visitors sparkline */}
          {ov?.kpi.visitors?.sparkline && ov.kpi.visitors.sparkline.some(d => d.visitors > 0) && (
            <Card className="!p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: C.muted }}>Visiteurs uniques — 7 derniers jours</p>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={ov.kpi.visitors.sparkline}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d: string) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} width={24} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visitors" stroke={C.turquoise} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* ── SECTION 2 — JOBS SEGMENTATION ── */}
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            <div className="flex" style={{ background: C.navy }}>
              {([
                ["rss", "📡 Offres RSS / Scrapées"],
                ["direct", "🏢 Offres Directes"],
                ["enrich", "✨ Offres Enrichies"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setJobTab(key)}
                  className="px-4 py-3 text-sm font-semibold transition-colors"
                  style={jobTab === key
                    ? { background: C.turquoise, color: "#FFFFFF" }
                    : { color: "rgba(255,255,255,0.7)" }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="bg-white p-5">
              {/* Tab A — RSS */}
              {jobTab === "rss" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ov?.jobs.sources.map(s => (
                      <div key={s.name} className="rounded-lg p-4" style={{ border: `1px solid ${C.border}` }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-sm" style={{ color: C.dark }}>{s.name}</p>
                          <StatusDot status={s.status} />
                        </div>
                        <p className="text-2xl font-bold" style={{ color: C.navy }}>{s.active}</p>
                        <p className="text-xs" style={{ color: C.muted }}>
                          actives · {s.expired} expirées · sync {relTime(s.lastSync)}
                        </p>
                        <button
                          onClick={() => forceSync(s.name)}
                          disabled={syncing === s.name}
                          className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50"
                          style={{ background: syncing === s.name ? C.turquoise : C.navy }}
                          onMouseEnter={e => { if (syncing !== s.name) (e.target as HTMLElement).style.background = C.turquoise; }}
                          onMouseLeave={e => { if (syncing !== s.name) (e.target as HTMLElement).style.background = C.navy; }}
                        >
                          {syncing === s.name ? "Sync lancée ✓" : "Forcer sync maintenant"}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 text-sm pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                    <span style={{ color: C.muted }}>Total scrapées : <b style={{ color: C.navy }}>{ov?.jobs.scraped.total}</b></span>
                    <span style={{ color: C.turquoise }}>Actives : <b>{ov?.jobs.scraped.active}</b></span>
                    <span style={{ color: C.muted }}>Expirées : <b>{ov?.jobs.scraped.expired}</b></span>
                  </div>
                </div>
              )}

              {/* Tab B — Direct */}
              {jobTab === "direct" && (
                <div className="overflow-x-auto">
                  {(ov?.jobs.direct.length ?? 0) === 0 ? (
                    <p className="text-sm py-6 text-center" style={{ color: C.muted }}>Aucune offre directe active</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: C.navy }}>
                          {["Titre", "Entreprise", "Ville", "Date", "👁️ Vues", "📬 Candid.", "📊 Taux", "Type", "Actions"].map(h => (
                            <th key={h} className="text-left py-2.5 px-3 text-xs font-semibold text-white whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ov?.jobs.direct.map((j, i) => (
                          <tr key={j.id} style={{ background: i % 2 ? C.light : "#FFFFFF" }}
                            onMouseEnter={e => (e.currentTarget.style.background = C.light)}
                            onMouseLeave={e => (e.currentTarget.style.background = i % 2 ? C.light : "#FFFFFF")}
                          >
                            <td className="py-2.5 px-3 font-medium max-w-[220px] truncate" style={{ color: C.dark }}>{j.title}</td>
                            <td className="py-2.5 px-3 truncate max-w-[140px]" style={{ color: C.muted }}>{j.company}</td>
                            <td className="py-2.5 px-3" style={{ color: C.muted }}>{j.city}</td>
                            <td className="py-2.5 px-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{relTime(j.postedAt)}</td>
                            <td className="py-2.5 px-3 text-sm font-bold" style={{ color: C.navy }}>{j.views}</td>
                            <td className="py-2.5 px-3">
                              <span className="text-sm font-bold" style={{ color: j.applications > 0 ? C.turquoise : C.muted }}>
                                {j.applications}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs font-semibold" style={{ color: j.conversionRate && j.conversionRate > 0 ? C.turquoise : C.muted }}>
                              {j.views > 0 ? `${(j.conversionRate ?? 0).toFixed(1)}%` : "—"}
                            </td>
                            <td className="py-2.5 px-3">
                              {j.sponsored && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: C.turquoise }}>
                                  Sponsorisée
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex gap-3">
                                <Link href={`/admin/offres/${j.id}`} className="text-xs font-medium hover:underline" style={{ color: C.navy }}>
                                  Stats →
                                </Link>
                                <a href={`/offres/${j.slug}`} target="_blank" rel="noreferrer" className="text-xs font-medium hover:underline" style={{ color: C.turquoise }}>
                                  Voir →
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* Tab C — Enrichment */}
              {jobTab === "enrich" && ov && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: C.dark }}>
                        Analyses RH remplies : <b style={{ color: C.navy }}>{ov.jobs.enrichment.done}</b> / {ov.jobs.enrichment.total}
                      </span>
                      <span style={{ color: C.muted }}>
                        {Math.round((ov.jobs.enrichment.done / Math.max(1, ov.jobs.enrichment.total)) * 100)}%
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                      <div className="h-full rounded-full transition-all" style={{
                        background: C.turquoise,
                        width: `${(ov.jobs.enrichment.done / Math.max(1, ov.jobs.enrichment.total)) * 100}%`,
                      }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg p-3" style={{ border: `1px solid ${C.border}` }}>
                      <p className="text-xs" style={{ color: C.muted }}>Dernier enrichissement</p>
                      <p className="font-bold" style={{ color: C.navy }}>{ov.jobs.enrichment.lastRun ? relTime(ov.jobs.enrichment.lastRun) : "—"}</p>
                    </div>
                    <div className="rounded-lg p-3" style={{ border: `1px solid ${C.border}` }}>
                      <p className="text-xs" style={{ color: C.muted }}>Coût Claude Haiku cumulé</p>
                      <p className="font-bold" style={{ color: C.navy }}>
                        {ov.jobs.enrichment.estCostUSD != null ? `$${ov.jobs.enrichment.estCostUSD}` : "—"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={forceEnrich}
                    disabled={enriching}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
                    style={{ background: enriching ? C.turquoise : C.navy }}
                  >
                    {enriching ? "Enrichissement lancé ✓" : "Enrichir les offres manquantes"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION 3 — CANDIDATURES ── */}
          <Card>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <SectionTitle>📬 Candidatures</SectionTitle>
              <button
                onClick={exportCSV}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ border: `1px solid ${C.navy}`, color: C.navy }}
              >
                Export CSV
              </button>
            </div>

            {/* Metrics row */}
            <div className="flex gap-6 mb-4 flex-wrap">
              {[
                ["Ce mois", appMetrics.month],
                ["Cette semaine", appMetrics.week],
                ["Aujourd'hui", appMetrics.today],
                ["Total", appMetrics.total],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xl font-bold" style={{ color: C.navy }}>{val}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={() => setAppFilter(null)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={appFilter === null
                  ? { background: C.turquoise, color: "#FFF", border: `1px solid ${C.turquoise}` }
                  : { border: `1px solid ${C.turquoise}`, color: C.navy }}>
                Toutes
              </button>
              {Object.entries(APP_STATUS).map(([key, s]) => (
                <button key={key} onClick={() => setAppFilter(key)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  style={appFilter === key
                    ? { background: C.turquoise, color: "#FFF", border: `1px solid ${C.turquoise}` }
                    : { border: `1px solid ${C.turquoise}`, color: C.navy }}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Table */}
            {filteredApps.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: C.muted }}>
                  Aucune candidature par offre enregistrée pour l'instant.
                </p>
                <p className="text-xs mt-1" style={{ color: C.muted }}>
                  Le tracking est actif via <code className="px-1 rounded" style={{ background: C.light }}>/api/apply</code> —
                  les candidatures Talent Pool restent dans l'onglet <Link href="/admin/candidats" className="hover:underline" style={{ color: C.turquoise }}>Talent Pool</Link>.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: C.navy }}>
                      {["Candidat", "Offre", "Entreprise", "Date", "Statut", ""].map((h, i) => (
                        <th key={i} className="text-left py-2.5 px-3 text-xs font-semibold text-white">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.slice(0, 50).map((a, i) => {
                      const st = APP_STATUS[a.status] || APP_STATUS.recue;
                      return (
                        <tr key={a.id} style={{ background: i % 2 ? C.light : "#FFFFFF" }}>
                          <td className="py-2.5 px-3">
                            <p className="font-medium" style={{ color: C.dark }}>{a.applicant_name || "—"}</p>
                            <p className="text-xs" style={{ color: C.muted }}>{maskEmail(a.applicant_email)}</p>
                          </td>
                          <td className="py-2.5 px-3 max-w-[180px]" style={{ color: C.dark }}>
                            <span className="block truncate">{a.job_title}</span>
                            {a.cv_url && (
                              <a href={a.cv_url} target="_blank" rel="noreferrer" className="text-xs font-medium hover:underline" style={{ color: C.turquoise }}>
                                📄 Voir CV
                              </a>
                            )}
                          </td>
                          <td className="py-2.5 px-3 max-w-[120px] truncate" style={{ color: C.muted }}>{a.company}</td>
                          <td className="py-2.5 px-3 text-xs whitespace-nowrap" style={{ color: C.muted }}>{relTime(a.created_at)}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-xs px-2 py-0.5 rounded-full text-white"
                              style={{ background: st.color, fontWeight: st.bold ? 700 : 500 }}>
                              {st.label}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={a.status}
                              onChange={e => setAppStatus(a.id, e.target.value)}
                              className="text-xs rounded px-1 py-0.5"
                              style={{ border: `1px solid ${C.border}`, color: C.navy }}
                            >
                              {Object.entries(APP_STATUS).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Top 5 most applied */}
            {(ov?.topJobs.length ?? 0) > 0 && (
              <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <p className="text-sm font-semibold mb-2" style={{ color: C.dark }}>Top 5 offres les plus candidatées</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={ov!.topJobs} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="job" width={180} tick={{ fontSize: 11, fill: C.muted }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={C.turquoise} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* ── SECTION 4 — REMOTE ANALYTICS ── */}
          <Card>
            <SectionTitle>🌍 Remote Jobs — interactjob.com</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={remoteDonut} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      <Cell fill={C.navy} />
                      <Cell fill={C.turquoise} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.navy }} /> Maroc ({ov?.kpi.activeJobs})</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: C.turquoise }} /> Remote ({ov?.remote.total})</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Sources RSS remote</p>
                {ov?.remote.feeds.map(f => {
                  const count = ov.remote.sources[f.name] || 0;
                  return (
                    <div key={f.name} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}>
                      <div>
                        <span className="text-sm font-medium" style={{ color: C.dark }}>{f.name}</span>
                        {f.reason && <p className="text-[10px]" style={{ color: C.muted }}>{f.reason}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {count > 0 && <span className="text-sm font-bold" style={{ color: C.navy }}>{count}</span>}
                        <StatusDot status={f.status} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs pt-1" style={{ color: C.muted }}>Dernière sync : {relTime(ov?.remote.lastSync)}</p>
              </div>
            </div>
          </Card>

          {/* ── SECTION 5 — SEO & CONTENT HEALTH ── */}
          <Card>
            <SectionTitle>🔍 SEO & Santé du contenu</SectionTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Offres indexables", value: ov?.seo.indexableOffres ?? 0, dot: C.turquoise },
                { label: "Articles blog", value: ov?.seo.articles ?? 0, dot: C.turquoise, sub: ov?.seo.lastArticle ? `dernier : ${relTime(ov.seo.lastArticle)}` : "" },
                { label: "Code du Travail", value: `${ov?.seo.codeTravail ?? 70} articles`, dot: C.turquoise, sub: "FAQ schema ✓" },
                { label: "AdSense", value: "Review en attente", dot: C.warn, small: true },
              ].map((s, i) => (
                <div key={i} className="rounded-lg p-3" style={{ border: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
                    <p className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>{s.label}</p>
                  </div>
                  <p className={s.small ? "text-sm font-bold" : "text-xl font-bold"} style={{ color: C.navy }}>{s.value}</p>
                  {s.sub && <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{s.sub}</p>}
                </div>
              ))}
            </div>
          </Card>

          {/* ── SECTION 6 — REVENUE TRACKER ── */}
          <Card>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <SectionTitle>💰 Revenus</SectionTitle>
              <p style={{ color: C.navy, fontWeight: 700, fontSize: 36, lineHeight: 1 }}>
                {(ov?.revenue.month ?? 0).toLocaleString("fr-FR")} <span className="text-base">MAD</span>
              </p>
            </div>

            {/* Goal progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: C.muted }}>Objectif mensuel : {(ov?.revenue.target ?? 0).toLocaleString("fr-FR")} MAD</span>
                <span style={{ color: C.navy, fontWeight: 600 }}>
                  {Math.min(100, Math.round(((ov?.revenue.month ?? 0) / Math.max(1, ov?.revenue.target ?? 1)) * 100))}%
                </span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: C.border }}>
                <div className="h-full rounded-full" style={{
                  background: C.turquoise,
                  width: `${Math.min(100, ((ov?.revenue.month ?? 0) / Math.max(1, ov?.revenue.target ?? 1)) * 100)}%`,
                }} />
              </div>
            </div>

            {/* Type breakdown */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                ["Sponsorisée", ov?.revenue.annonces ?? 0],
                ["Test Personnalité", ov?.revenue.personality ?? 0],
                ["CV Builder", 0],
                ["Conseil RH", 0],
              ].map(([label, val]) => (
                <span key={label as string} className="text-xs px-3 py-1 rounded-full text-white font-medium" style={{ background: C.navy }}>
                  {label} · {(val as number).toLocaleString("fr-FR")} MAD
                </span>
              ))}
            </div>

            {/* History line chart */}
            {(ov?.revenue.history.length ?? 0) > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={ov!.revenue.history} margin={{ left: 0, right: 10, top: 5 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.muted }} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} width={45} />
                  <Tooltip />
                  <Line type="monotone" dataKey="mad" stroke={C.navy} strokeWidth={2}
                    dot={{ fill: C.turquoise, r: 4, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-center py-6" style={{ color: C.muted }}>
                Historique vide — les paiements complétés apparaîtront ici mois par mois.
              </p>
            )}
          </Card>
        </div>

        {/* ════ SECTION 7 — QUICK ACTIONS SIDEBAR ════ */}
        <div className="space-y-4">
          <div className="xl:sticky xl:top-20 h-fit rounded-xl p-4 space-y-2" style={{ background: C.navy }}>
            <p className="text-white font-bold text-sm mb-3">⚡ Actions rapides</p>
            {[
              { label: "🔄 Forcer enrichissement Haiku", onClick: forceEnrich },
              { label: "✍️ Publier un article blog", href: "/admin/blog" },
              { label: "➕ Ajouter une offre manuelle", href: "/admin/offres/ajouter" },
              { label: "📧 Marketing Employeurs", href: "/admin/marketing" },
              { label: "🚂 Logs Railway", href: "https://railway.app/dashboard", ext: true },
              { label: "📊 Vercel Analytics", href: "https://vercel.com/analytics", ext: true },
              { label: "🔍 Search Console", href: "https://search.google.com/search-console", ext: true },
            ].map((a, i) =>
              a.onClick ? (
                <button key={i} onClick={a.onClick}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-white"
                  style={{ color: C.navy }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.turquoise; e.currentTarget.style.color = "#FFF"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#FFF"; e.currentTarget.style.color = C.navy; }}>
                  {a.label}
                </button>
              ) : a.ext ? (
                <a key={i} href={a.href} target="_blank" rel="noreferrer"
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-white"
                  style={{ color: C.navy }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.turquoise; e.currentTarget.style.color = "#FFF"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#FFF"; e.currentTarget.style.color = C.navy; }}>
                  {a.label} ↗
                </a>
              ) : (
                <Link key={i} href={a.href!}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors bg-white"
                  style={{ color: C.navy }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.turquoise; e.currentTarget.style.color = "#FFF"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#FFF"; e.currentTarget.style.color = C.navy; }}>
                  {a.label}
                </Link>
              )
            )}
          </div>

          {/* Activity feed */}
          {(ov?.recentActivity?.length ?? 0) > 0 && (
            <div className="rounded-xl p-4" style={{ background: "#fff", border: `1px solid ${C.border}` }}>
              <p className="font-bold text-sm mb-3" style={{ color: C.dark }}>🕐 Dernière activité</p>
              <div className="space-y-2">
                {ov!.recentActivity!.slice(0, 10).map((ev, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-base leading-tight">
                      {ev.type === "candidature" ? "📬" : "📋"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: C.dark }}>{ev.label}</p>
                      {ev.sub && <p className="text-[11px] truncate" style={{ color: C.muted }}>{ev.sub}</p>}
                      <p className="text-[11px]" style={{ color: C.turquoise }}>{relTime(ev.at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
