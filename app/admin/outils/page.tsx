"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

interface FunnelStep { step: string; label: string; count: number; backfilledCount: number; liveCount: number; pct: number }
interface ToolData {
  tool: string;
  funnel: FunnelStep[];
  metrics: {
    views: number;
    freeUsage: number;
    purchaseAttempts: number;
    paymentsCompleted: number;
    failedPayments: number;
    failedPaymentReasons: { reason: string; count: number }[];
    conversionRate: number;
    dropOff: { from: string; to: string; dropPct: number } | null;
  };
  revenue: { total: number; byCurrency: { currency: string; total: number; count: number }[]; avgPerVisitor: number };
}
interface FailureEntry {
  tool: string; testType: string | null; event: string; reason: string;
  country: string | null; currency: string | null; createdAt: string;
}
interface ApiResponse {
  generatedAt: string;
  liveTrackingSince: string;
  tools: Record<string, ToolData>;
  failureLog: FailureEntry[];
  topProblems: { tool: string; event: string; reason: string; count: number }[];
  revenueComparison: { tool: string; revenue: number; avgPerVisitor: number }[];
  filterOptions: { countries: string[]; currencies: string[] };
}

const TOOL_LABELS: Record<string, string> = {
  cv_checker: "CV Checker",
  cv_builder: "CV Builder",
  personality_test: "Tests Personnalité",
  email_alerts: "Alertes Email",
};
const TOOL_COLORS: Record<string, string> = {
  cv_checker: "#2563EB",
  cv_builder: "#059669",
  personality_test: "#7C3AED",
  email_alerts: "#D97706",
};
const EVENT_LABELS: Record<string, string> = {
  upload_failed: "Upload échoué",
  payment_failed: "Paiement échoué",
};
const RANGE_LABELS: Record<string, string> = { today: "Aujourd'hui", "7d": "7 jours", "30d": "30 jours", all: "Tout" };

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function FunnelBars({ tool, data }: { tool: string; data: ToolData }) {
  const color = TOOL_COLORS[tool];
  const max = data.funnel[0]?.count || 1;
  return (
    <div className="space-y-2.5">
      {data.funnel.map((s, i) => {
        const isDropOffFrom = data.metrics.dropOff?.from === s.label;
        const livePct = Math.max((s.liveCount / max) * 100, s.liveCount > 0 ? 2 : 0);
        const backfilledPct = Math.max((s.backfilledCount / max) * 100, s.backfilledCount > 0 ? 2 : 0);
        const opacity = 0.5 + (i / data.funnel.length) * 0.5;
        return (
          <div key={s.step}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-gray-700">{s.label}</span>
              <span className="text-gray-500">
                {s.count.toLocaleString("fr-FR")} <span className="text-gray-400">({s.pct}%)</span>
                {s.backfilledCount > 0 && (
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">
                    dont {s.backfilledCount.toLocaleString("fr-FR")} historique
                  </span>
                )}
                {isDropOffFrom && <span className="ml-1.5 text-red-500 font-semibold">⚠ plus gros abandon ici</span>}
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden flex">
              {/* Live-tracked segment — solid */}
              <div
                className="h-3 transition-all duration-500"
                style={{ width: `${livePct}%`, background: color, opacity }}
                title={`${s.liveCount.toLocaleString("fr-FR")} suivi en direct`}
              />
              {/* Backfilled segment — hatched/lighter, visually distinct */}
              {s.backfilledCount > 0 && (
                <div
                  className="h-3 transition-all duration-500 border-l border-white/50"
                  style={{
                    width: `${backfilledPct}%`,
                    background: `repeating-linear-gradient(45deg, ${color}55, ${color}55 3px, ${color}25 3px, ${color}25 6px)`,
                  }}
                  title={`${s.backfilledCount.toLocaleString("fr-FR")} importé de l'historique`}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ToolSection({ tool, data }: { tool: string; data: ToolData }) {
  const m = data.metrics;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{TOOL_LABELS[tool]}</h3>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${TOOL_COLORS[tool]}15`, color: TOOL_COLORS[tool] }}>
          Conversion : {m.conversionRate}%
        </span>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Vues", value: m.views },
          { label: "Usage gratuit", value: m.freeUsage },
          { label: "Tentatives d'achat", value: m.purchaseAttempts },
          { label: "Paiements réussis", value: m.paymentsCompleted },
        ].map((k) => (
          <div key={k.label} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
            <div className="text-lg font-bold text-gray-900">{k.value.toLocaleString("fr-FR")}</div>
            <div className="text-[11px] text-gray-500">{k.label}</div>
          </div>
        ))}
      </div>

      <FunnelBars tool={tool} data={data} />

      {(m.failedPayments > 0 || data.revenue.total > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs">
          {m.failedPayments > 0 && (
            <span className="text-red-600 font-semibold">🔴 {m.failedPayments} paiement(s) échoué(s)</span>
          )}
          <span className="text-gray-600">
            💰 Revenu : <strong>{data.revenue.total.toLocaleString("fr-FR")}</strong>
            {data.revenue.byCurrency.map((c) => ` ${c.currency}`).join(", ")}
          </span>
          <span className="text-gray-500">Moy./visiteur : {data.revenue.avgPerVisitor}</span>
        </div>
      )}
    </div>
  );
}

export default function OutilsPage() {
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ range });
    if (country) params.set("country", country);
    if (currency) params.set("currency", currency);
    const res = await fetch(`/api/admin/tool-funnel?${params}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [range, country, currency, router]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  if (loading || !data) {
    return <div className="flex items-center justify-center h-48 text-gray-400">Chargement…</div>;
  }

  const totalViews = Object.values(data.tools).reduce((a, t) => a + t.metrics.views, 0);
  const totalVerified = Object.values(data.tools).reduce((a, t) => a + t.metrics.paymentsCompleted, 0);
  const totalRevenue = data.revenueComparison.reduce((a, r) => a + r.revenue, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outils & Conversions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Funnels CV Checker · CV Builder · Tests de personnalité — {relTime(data.generatedAt)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={range} onChange={(e) => setRange(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
            {Object.entries(RANGE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
            <option value="">Tous pays</option>
            {data.filterOptions.countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
            <option value="">Toutes devises</option>
            {data.filterOptions.currencies.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Honest labeling — what's imported history vs what's genuinely measured */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-900">
        <p>
          <strong>Vues et complétions gratuites</strong> : historique importé depuis les données déjà existantes
          (page_views, cvcheckusages, personality_assessments) — voir les badges <em>« historique »</em> ci-dessous.
          <br />
          <strong>Événements d&apos;interaction</strong> (uploads, abandons, checkout, paiements CV Builder…) :
          suivis en direct depuis le{" "}
          {new Date(data.liveTrackingSince).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}{" "}
          uniquement — non rétroactifs, car jamais enregistrés avant cette date.
        </p>
      </div>

      {/* Global summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString("fr-FR")}</div>
          <div className="text-xs text-gray-500 mt-0.5">vues cumulées (3 outils)</div>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4">
          <div className="text-2xl font-bold text-green-600">{totalVerified.toLocaleString("fr-FR")}</div>
          <div className="text-xs text-gray-500 mt-0.5">paiements réussis</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString("fr-FR")}</div>
          <div className="text-xs text-gray-500 mt-0.5">revenu total (toutes devises confondues)</div>
        </div>
      </div>

      {/* Top problèmes */}
      {data.topProblems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="font-semibold text-amber-800 mb-2 text-sm">🔎 Top problèmes — là où l&apos;argent se perd</p>
          <div className="space-y-1.5">
            {data.topProblems.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-white/70 rounded-lg px-3 py-2">
                <span className="text-amber-900">
                  <strong>{TOOL_LABELS[p.tool] ?? p.tool}</strong> — {EVENT_LABELS[p.event] ?? p.event} : {p.reason}
                </span>
                <span className="font-bold text-amber-700">{p.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funnels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {Object.entries(data.tools).map(([tool, toolData]) => (
          <ToolSection key={tool} tool={tool} data={toolData} />
        ))}
      </div>

      {/* Revenue comparison */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Comparaison des revenus par outil</h3>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={data.revenueComparison.map((r) => ({ name: TOOL_LABELS[r.tool] ?? r.tool, Revenu: r.revenue, "Moy./visiteur": r.avgPerVisitor }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RTooltip />
              <Legend />
              <Bar dataKey="Revenu" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Failure log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Journal des échecs (upload / paiement)</h3>
          <p className="text-xs text-gray-500 mt-0.5">Chaque échec est un lead ou une vente perdue — les raisons exactes servent à corriger les bugs.</p>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Outil</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Événement</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Raison</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Pays</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Devise</th>
                <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Quand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.failureLog.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Aucun échec sur cette période 🎉</td></tr>
              ) : data.failureLog.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{TOOL_LABELS[f.tool] ?? f.tool}{f.testType ? ` · ${f.testType}` : ""}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">{EVENT_LABELS[f.event] ?? f.event}</span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{f.reason}</td>
                  <td className="px-4 py-2.5 text-gray-500">{f.country ?? "—"}</td>
                  <td className="px-4 py-2.5 text-gray-500">{f.currency ?? "—"}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{relTime(f.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
