"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RTooltip,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend,
} from "recharts";

const NAVY = "#00347A";
const TURQUOISE = "#00C2CB";
const GREEN = "#10B981";
const RED = "#EF4444";
const BORDER = "#D0E4F0";
const LIGHT = "#F0F8FF";

interface Kpis {
  totalActive: number;
  pendingConfirmation: number;
  unsubscribedCount: number;
  bouncedCount: number;
  newToday: number;
  new7d: number;
  new7dTrend: number;
  new30d: number;
  emailsSent30d: number;
  confirmationRate: number;
  unsubscribeRate: number;
  openRate: number;
  byType: Record<string, number>;
}
interface SubscriberRow {
  id: string;
  emailMasked: string;
  alertType: string;
  filters: { secteur?: string; ville?: string; keywords?: string[] };
  language: string;
  status: "active" | "pending" | "unsubscribed" | "bounced";
  createdAt: string;
  emailsSentCount: number;
  lastEmailSentAt: string | null;
}
interface BatchRow {
  runId: string;
  alertType: string;
  sentAt: string;
  recipients: number;
  uniqueOffers: number;
  sentCount: number;
  failedCount: number;
  status: "ok" | "partial" | "failed";
}
interface RecipientDetail {
  id: string;
  emailMasked: string;
  offersIncluded: string[];
  status: string;
  errorReason: string | null;
  sentAt: string;
}
interface AlertsApiResponse {
  kpis: Kpis;
  health: "green" | "yellow" | "red";
  lastSendAt: string | null;
  hoursSinceLastSend: number | null;
  growth: { date: string; total: number }[];
  subscribers: SubscriberRow[];
  pagination: { page: number; pageSize: number; total: number };
}
interface LogsApiResponse {
  batches: BatchRow[];
  byDay: { _id: string; sent: number; failed: number }[];
  pagination: { page: number; pageSize: number; total: number };
}

const TYPE_LABELS: Record<string, string> = { offres: "Offres", concours: "Concours", remote: "Remote" };
const TYPE_COLORS: Record<string, string> = { offres: NAVY, concours: TURQUOISE, remote: GREEN };
const STATUS_BADGES: Record<string, { label: string; bg: string; fg: string }> = {
  active: { label: "✅ Actif", bg: "#ECFDF5", fg: "#059669" },
  pending: { label: "⏳ En attente", bg: "#FFFBEB", fg: "#B45309" },
  unsubscribed: { label: "❌ Désinscrit", bg: "#F3F4F6", fg: "#6B7280" },
  bounced: { label: "⚠️ Bounced", bg: "#FEF2F2", fg: "#DC2626" },
};
const LOG_STATUS_BADGES: Record<string, { label: string; bg: string; fg: string }> = {
  ok: { label: "OK", bg: "#ECFDF5", fg: "#059669" },
  partial: { label: "Partiel", bg: "#FFFBEB", fg: "#B45309" },
  failed: { label: "Échec total", bg: "#FEF2F2", fg: "#DC2626" },
};

function relTime(iso?: string | null) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
function describeFilters(f: SubscriberRow["filters"]) {
  const parts = [...(f.keywords || []), f.secteur, f.ville].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Tous";
}
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function HealthBanner({ health, lastSendAt, hoursSinceLastSend, totalActive }: { health: string; lastSendAt: string | null; hoursSinceLastSend: number | null; totalActive: number }) {
  if (health === "green") {
    return (
      <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: "#ECFDF5", borderColor: "#A7F3D0" }}>
        <span className="text-xl">🟢</span>
        <div>
          <p className="font-bold text-sm" style={{ color: "#065F46" }}>Système actif</p>
          <p className="text-xs" style={{ color: "#047857" }}>
            Dernier envoi {relTime(lastSendAt)} ({hoursSinceLastSend != null ? Math.round(hoursSinceLastSend) : "?"} h) · {totalActive} abonné(s) actif(s)
          </p>
        </div>
      </div>
    );
  }
  if (health === "yellow") {
    return (
      <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
        <span className="text-xl">🟡</span>
        <div>
          <p className="font-bold text-sm" style={{ color: "#92400E" }}>Attention</p>
          <p className="text-xs" style={{ color: "#B45309" }}>
            Aucun envoi depuis {hoursSinceLastSend != null ? Math.round(hoursSinceLastSend / 24) : "?"} jour(s) malgré {totalActive} abonné(s) actif(s).
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border p-4 flex items-center gap-3" style={{ background: "#FEF2F2", borderColor: "#FECACA" }}>
      <span className="text-xl">🔴</span>
      <div>
        <p className="font-bold text-sm" style={{ color: "#991B1B" }}>Système inactif</p>
        <p className="text-xs" style={{ color: "#DC2626" }}>
          Aucun email envoyé. Les abonnés ne reçoivent rien. Vérifiez le cron{" "}
          <code className="bg-red-100 px-1 py-0.5 rounded">runAlertsSender()</code> sur Railway, ou utilisez « Envoyer une alerte maintenant » ci-dessous.
        </p>
      </div>
    </div>
  );
}

function KpiCard({ label, value, suffix, trend }: { label: string; value: string | number; suffix?: string; trend?: number }) {
  return (
    <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
      <p className="text-2xl font-bold" style={{ color: NAVY }}>
        {value}{suffix}
      </p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <p className="text-xs text-gray-500">{label}</p>
        {trend != null && (
          <span className={`text-[11px] font-semibold ${trend > 0 ? "text-green-600" : trend < 0 ? "text-red-500" : "text-gray-400"}`}>
            {trend > 0 ? "▲" : trend < 0 ? "▼" : "—"} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function AlertesPage() {
  const router = useRouter();
  const [data, setData] = useState<AlertsApiResponse | null>(null);
  const [logsData, setLogsData] = useState<LogsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"subscribers" | "logs">("subscribers");

  const [subType, setSubType] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [subLanguage, setSubLanguage] = useState("");
  const [subSearchRaw, setSubSearchRaw] = useState("");
  const subSearch = useDebounced(subSearchRaw);
  const [subDateFrom, setSubDateFrom] = useState("");
  const [subDateTo, setSubDateTo] = useState("");
  const [subPage, setSubPage] = useState(1);

  const [logType, setLogType] = useState("");
  const [logStatus, setLogStatus] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<BatchRow | null>(null);
  const [batchDetail, setBatchDetail] = useState<RecipientDetail[] | null>(null);

  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [sendingNow, setSendingNow] = useState(false);
  const [resending, setResending] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const firstLoad = useRef(true);

  const loadMain = useCallback(async () => {
    const params = new URLSearchParams({ page: String(subPage) });
    if (subType) params.set("type", subType);
    if (subStatus) params.set("status", subStatus);
    if (subLanguage) params.set("language", subLanguage);
    if (subSearch) params.set("search", subSearch);
    if (subDateFrom) params.set("dateFrom", subDateFrom);
    if (subDateTo) params.set("dateTo", subDateTo);
    const res = await fetch(`/api/admin/alerts?${params}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    setData(await res.json());
  }, [subPage, subType, subStatus, subLanguage, subSearch, subDateFrom, subDateTo, router]);

  const loadLogs = useCallback(async () => {
    const params = new URLSearchParams({ page: String(logPage) });
    if (logType) params.set("type", logType);
    if (logStatus) params.set("status", logStatus);
    const res = await fetch(`/api/admin/alerts/logs?${params}`);
    if (res.status === 401) return;
    setLogsData(await res.json());
  }, [logPage, logType, logStatus]);

  useEffect(() => {
    if (firstLoad.current) { setLoading(true); firstLoad.current = false; }
    Promise.all([loadMain(), loadLogs()]).finally(() => setLoading(false));
  }, [loadMain, loadLogs]);

  async function openBatch(b: BatchRow) {
    setSelectedBatch(b);
    setBatchDetail(null);
    const res = await fetch(`/api/admin/alerts/logs/detail?runId=${encodeURIComponent(b.runId)}&alertType=${encodeURIComponent(b.alertType)}`);
    const d = await res.json();
    setBatchDetail(d.recipients || []);
  }

  async function handleSendNow() {
    if (!confirm("Envoyer une alerte maintenant à tous les abonnés confirmés éligibles ? Ceci envoie de vrais emails.")) return;
    setSendingNow(true);
    setActionMsg(null);
    const res = await fetch("/api/admin/alerts/send-now", { method: "POST" });
    const d = await res.json();
    setActionMsg(res.ok
      ? `✅ Envoi terminé — ${d.sent} envoyé(s), ${d.failed} échec(s), ${d.skippedNoMatch} sans nouveauté (${d.totalConfirmed} confirmé(s) au total)`
      : `❌ Erreur : ${d.error}`);
    setSendingNow(false);
    loadMain(); loadLogs();
  }

  async function handleResendConfirmations() {
    if (!confirm(`Renvoyer l'email de confirmation à ${data?.kpis.pendingConfirmation ?? 0} abonné(s) en attente ? Ceci envoie de vrais emails.`)) return;
    setResending(true);
    setActionMsg(null);
    const res = await fetch("/api/admin/alerts/resend-confirmations", { method: "POST" });
    const d = await res.json();
    if (!res.ok) setActionMsg(`❌ Erreur : ${d.error}`);
    else if (d.warning) setActionMsg(`⚠️ ${d.warning}`);
    else setActionMsg(`✅ ${d.sent}/${d.total} confirmation(s) renvoyée(s), ${d.failed} échec(s)`);
    setResending(false);
    loadMain();
  }

  async function handleTestSend() {
    setTestSending(true);
    setActionMsg(null);
    const res = await fetch("/api/admin/alerts/test-send", { method: "POST" });
    const d = await res.json();
    if (!res.ok) setActionMsg(`❌ Erreur : ${d.error}`);
    else if (d.delivered === false) setActionMsg(`⚠️ Non livré : ${d.error}`);
    else setActionMsg(`✅ Email de test envoyé à ${d.to}`);
    setTestSending(false);
  }

  if (loading || !data) {
    return <div className="flex items-center justify-center h-48 text-gray-400">Chargement…</div>;
  }

  const { kpis, health, lastSendAt, hoursSinceLastSend, growth, subscribers, pagination } = data;
  const donutData = Object.entries(kpis.byType).map(([type, count]) => ({ name: TYPE_LABELS[type] || type, value: count, type }));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>📬 Alertes Email</h1>
          <p className="text-gray-500 text-sm mt-1">Abonnements, envois et engagement des alertes offres / concours / remote.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/api/admin/alerts/export"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
            style={{ background: NAVY }}
          >
            ⬇️ Export CSV
          </Link>
          <button onClick={() => { loadMain(); loadLogs(); }} className="text-xs text-gray-400 hover:text-[#00347A] border px-3 py-1.5 rounded-lg" style={{ borderColor: BORDER }}>
            ↻ Actualiser
          </button>
        </div>
      </div>

      <HealthBanner health={health} lastSendAt={lastSendAt} hoursSinceLastSend={hoursSinceLastSend} totalActive={kpis.totalActive} />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Abonnés actifs" value={kpis.totalActive.toLocaleString("fr-FR")} />
        <KpiCard label="En attente de confirmation" value={kpis.pendingConfirmation.toLocaleString("fr-FR")} />
        <KpiCard label="Nouveaux (7j)" value={kpis.new7d.toLocaleString("fr-FR")} trend={kpis.new7dTrend} />
        <KpiCard label="Emails envoyés (30j)" value={kpis.emailsSent30d.toLocaleString("fr-FR")} />
        <KpiCard label="Taux de confirmation" value={kpis.confirmationRate} suffix="%" />
        <KpiCard label="Taux de désinscription" value={kpis.unsubscribeRate} suffix="%" />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap items-center gap-3" style={{ border: `1px solid ${BORDER}` }}>
        <button onClick={handleSendNow} disabled={sendingNow} className="text-xs font-semibold px-3 py-2 rounded-lg text-white disabled:opacity-50" style={{ background: TURQUOISE }}>
          {sendingNow ? "Envoi en cours…" : "📤 Envoyer une alerte maintenant"}
        </button>
        <button onClick={handleResendConfirmations} disabled={resending} className="text-xs font-semibold px-3 py-2 rounded-lg text-white disabled:opacity-50" style={{ background: NAVY }}>
          {resending ? "Envoi en cours…" : "✉️ Renvoyer les confirmations"}
        </button>
        <button onClick={handleTestSend} disabled={testSending} className="text-xs font-semibold px-3 py-2 rounded-lg border disabled:opacity-50" style={{ borderColor: BORDER, color: NAVY }}>
          {testSending ? "Envoi…" : "🧪 Tester l'envoi"}
        </button>
        {actionMsg && <span className="text-xs text-gray-600">{actionMsg}</span>}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 lg:col-span-2" style={{ border: `1px solid ${BORDER}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: NAVY }}>Croissance des abonnés (30j)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growth} margin={{ left: -20, right: 10, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <RTooltip labelFormatter={(d) => new Date(d).toLocaleDateString("fr-FR")} />
              <Line type="monotone" dataKey="total" stroke={NAVY} strokeWidth={2} dot={{ r: 2, fill: TURQUOISE }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: NAVY }}>Répartition par type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {donutData.map((d) => <Cell key={d.type} fill={TYPE_COLORS[d.type] || "#9CA3AF"} />)}
              </Pie>
              <RTooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${BORDER}` }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: NAVY }}>Envois par jour (30j)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={logsData?.byDay || []} margin={{ left: -20, right: 10, top: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
            <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <RTooltip labelFormatter={(d) => new Date(d).toLocaleDateString("fr-FR")} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="sent" name="Envoyés" stackId="a" fill={TURQUOISE} />
            <Bar dataKey="failed" name="Échecs" stackId="a" fill={RED} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["subscribers", "logs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1.5 text-sm font-semibold rounded-md transition-colors"
            style={tab === t ? { background: "#fff", color: NAVY, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: "#6B7280" }}
          >
            {t === "subscribers" ? "Abonnés" : "Historique des envois"}
          </button>
        ))}
      </div>

      {tab === "subscribers" && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex flex-wrap gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <input
              value={subSearchRaw}
              onChange={(e) => { setSubSearchRaw(e.target.value); setSubPage(1); }}
              placeholder="Rechercher par email…"
              className="px-3 py-1.5 text-sm rounded-lg"
              style={{ border: `1px solid ${BORDER}`, width: 200 }}
            />
            <select value={subType} onChange={(e) => { setSubType(e.target.value); setSubPage(1); }} className="px-3 py-1.5 text-sm rounded-lg bg-white" style={{ border: `1px solid ${BORDER}` }}>
              <option value="">Tous types</option>
              <option value="offres">Offres</option>
              <option value="concours">Concours</option>
              <option value="remote">Remote</option>
            </select>
            <select value={subStatus} onChange={(e) => { setSubStatus(e.target.value); setSubPage(1); }} className="px-3 py-1.5 text-sm rounded-lg bg-white" style={{ border: `1px solid ${BORDER}` }}>
              <option value="">Tous statuts</option>
              <option value="active">Actif</option>
              <option value="pending">En attente</option>
              <option value="unsubscribed">Désinscrit</option>
              <option value="bounced">Bounced</option>
            </select>
            <select value={subLanguage} onChange={(e) => { setSubLanguage(e.target.value); setSubPage(1); }} className="px-3 py-1.5 text-sm rounded-lg bg-white" style={{ border: `1px solid ${BORDER}` }}>
              <option value="">Toutes langues</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
            <input type="date" value={subDateFrom} onChange={(e) => { setSubDateFrom(e.target.value); setSubPage(1); }} className="px-3 py-1.5 text-sm rounded-lg" style={{ border: `1px solid ${BORDER}` }} />
            <input type="date" value={subDateTo} onChange={(e) => { setSubDateTo(e.target.value); setSubPage(1); }} className="px-3 py-1.5 text-sm rounded-lg" style={{ border: `1px solid ${BORDER}` }} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: LIGHT }}>
                <tr>
                  {["Email (masqué)", "Type d'alerte", "Filtres", "Langue", "Statut", "Emails reçus", "Inscrit le"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: BORDER }}>
                {subscribers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucun abonné</td></tr>
                ) : subscribers.map((s) => {
                  const badge = STATUS_BADGES[s.status];
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.emailMasked}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: TYPE_COLORS[s.alertType] || "#9CA3AF" }}>
                          {TYPE_LABELS[s.alertType] || s.alertType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">{describeFilters(s.filters)}</td>
                      <td className="px-4 py-2.5 text-gray-500 uppercase text-xs">{s.language}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: badge.bg, color: badge.fg }}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{s.emailsSentCount}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{relTime(s.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-500" style={{ borderTop: `1px solid ${BORDER}` }}>
            <span>{pagination.total} abonné(s) au total</span>
            <div className="flex gap-2">
              <button disabled={subPage <= 1} onClick={() => setSubPage((p) => p - 1)} className="px-2.5 py-1 rounded-lg disabled:opacity-40" style={{ border: `1px solid ${BORDER}` }}>← Préc.</button>
              <span>Page {subPage}</span>
              <button disabled={subPage * pagination.pageSize >= pagination.total} onClick={() => setSubPage((p) => p + 1)} className="px-2.5 py-1 rounded-lg disabled:opacity-40" style={{ border: `1px solid ${BORDER}` }}>Suiv. →</button>
            </div>
          </div>
        </div>
      )}

      {tab === "logs" && logsData && (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
          <div className="flex flex-wrap gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <select value={logType} onChange={(e) => { setLogType(e.target.value); setLogPage(1); }} className="px-3 py-1.5 text-sm rounded-lg bg-white" style={{ border: `1px solid ${BORDER}` }}>
              <option value="">Tous types</option>
              <option value="offres">Offres</option>
              <option value="concours">Concours</option>
              <option value="remote">Remote</option>
            </select>
            <select value={logStatus} onChange={(e) => { setLogStatus(e.target.value); setLogPage(1); }} className="px-3 py-1.5 text-sm rounded-lg bg-white" style={{ border: `1px solid ${BORDER}` }}>
              <option value="">Tous statuts</option>
              <option value="ok">OK</option>
              <option value="partial">Partiel</option>
              <option value="failed">Échec total</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: LIGHT }}>
                <tr>
                  {["Date", "Type", "Destinataires", "Offres incluses", "Envoyés", "Échecs", "Statut"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: BORDER }}>
                {logsData.batches.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucun envoi enregistré</td></tr>
                ) : logsData.batches.map((b) => {
                  const badge = LOG_STATUS_BADGES[b.status];
                  return (
                    <tr key={`${b.runId}_${b.alertType}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => openBatch(b)}>
                      <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{relTime(b.sentAt)}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ background: TYPE_COLORS[b.alertType] || "#9CA3AF" }}>
                          {TYPE_LABELS[b.alertType] || b.alertType}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">{b.recipients}</td>
                      <td className="px-4 py-2.5 text-gray-500">{b.uniqueOffers}</td>
                      <td className="px-4 py-2.5 text-green-600 font-semibold">{b.sentCount}</td>
                      <td className="px-4 py-2.5" style={{ color: b.failedCount > 0 ? RED : "#9CA3AF", fontWeight: b.failedCount > 0 ? 700 : 400 }}>{b.failedCount}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: badge.bg, color: badge.fg }}>{badge.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-500" style={{ borderTop: `1px solid ${BORDER}` }}>
            <span>{logsData.pagination.total} envoi(s) au total</span>
            <div className="flex gap-2">
              <button disabled={logPage <= 1} onClick={() => setLogPage((p) => p - 1)} className="px-2.5 py-1 rounded-lg disabled:opacity-40" style={{ border: `1px solid ${BORDER}` }}>← Préc.</button>
              <span>Page {logPage}</span>
              <button disabled={logPage * logsData.pagination.pageSize >= logsData.pagination.total} onClick={() => setLogPage((p) => p + 1)} className="px-2.5 py-1 rounded-lg disabled:opacity-40" style={{ border: `1px solid ${BORDER}` }}>Suiv. →</button>
            </div>
          </div>
        </div>
      )}

      {/* Drill-down modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedBatch(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <h3 className="font-bold" style={{ color: NAVY }}>
                  {TYPE_LABELS[selectedBatch.alertType]} — {relTime(selectedBatch.sentAt)}
                </h3>
                <p className="text-xs text-gray-500">{selectedBatch.recipients} destinataire(s), {selectedBatch.failedCount} échec(s)</p>
              </div>
              <button onClick={() => setSelectedBatch(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto p-4">
              {!batchDetail ? (
                <div className="text-center text-gray-400 py-8">Chargement…</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-1.5 pr-3">Email</th>
                      <th className="py-1.5 pr-3">Offres</th>
                      <th className="py-1.5 pr-3">Statut</th>
                      <th className="py-1.5">Erreur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: BORDER }}>
                    {batchDetail.map((r) => (
                      <tr key={r.id}>
                        <td className="py-1.5 pr-3 font-medium">{r.emailMasked}</td>
                        <td className="py-1.5 pr-3 text-gray-500">{r.offersIncluded.length}</td>
                        <td className="py-1.5 pr-3">
                          <span className={r.status === "sent" ? "text-green-600" : "text-red-600"}>{r.status}</span>
                        </td>
                        <td className="py-1.5 text-xs text-gray-500">{r.errorReason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
