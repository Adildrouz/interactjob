"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Kpis {
  totalActive: number;
  pendingConfirmation: number;
  unsubscribedCount: number;
  bouncedCount: number;
  newToday: number;
  new7d: number;
  new30d: number;
  emailsSentThisMonth: number;
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
  status: string;
  confirmed: boolean;
  createdAt: string;
  emailsSentCount: number;
  lastEmailSentAt: string | null;
}
interface LogRow {
  id: string;
  alertType: string;
  offersIncluded: string[];
  sentAt: string;
  status: string;
  errorReason: string | null;
}

const TYPE_LABELS: Record<string, string> = { offres: "Offres", concours: "Concours", remote: "Remote" };
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Actif", color: "bg-green-100 text-green-700" },
  unsubscribed: { label: "Désinscrit", color: "bg-gray-100 text-gray-500" },
  bounced: { label: "Bounced", color: "bg-red-100 text-red-700" },
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

export default function AlertesPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [healthWarning, setHealthWarning] = useState(false);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"subscribers" | "logs">("subscribers");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    const [mainRes, logsRes] = await Promise.all([
      fetch(`/api/admin/alerts?${params}`),
      fetch(`/api/admin/alerts/logs?page=1`),
    ]);
    if (mainRes.status === 401) { router.push("/admin/login"); return; }
    const mainData = await mainRes.json();
    const logsData = await logsRes.json();
    setKpis(mainData.kpis);
    setHealthWarning(mainData.healthWarning);
    setSubscribers(mainData.subscribers);
    setSubTotal(mainData.pagination.total);
    setLogs(logsData.logs);
    setLoading(false);
  }, [page, typeFilter, statusFilter, router]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  if (loading || !kpis) {
    return <div className="flex items-center justify-center h-48 text-gray-400">Chargement…</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertes Email</h1>
          <p className="text-sm text-gray-500 mt-0.5">Abonnements, envois et engagement des alertes offres/concours/remote.</p>
        </div>
        <Link
          href="/api/admin/alerts/export"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0A2D6E] hover:bg-[#0d3a8e] rounded-lg transition-colors"
        >
          ⬇️ Exporter CSV
        </Link>
      </div>

      {healthWarning && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <p className="font-bold text-red-800 text-sm">🔴 Alerte système — aucun email envoyé depuis 7 jours</p>
          <p className="text-xs text-red-700 mt-1">
            {kpis.totalActive} abonné(s) actif(s) et confirmé(s) n&apos;ont reçu aucune alerte cette semaine. Vérifiez que le cron
            <code className="mx-1 bg-red-100 px-1.5 py-0.5 rounded">runAlertsSender()</code>
            tourne bien sur Railway et que des offres correspondent à leurs critères.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Abonnés actifs", value: kpis.totalActive, tint: "text-green-600" },
          { label: "En attente confirmation", value: kpis.pendingConfirmation, tint: "text-amber-600" },
          { label: "Désinscrits", value: kpis.unsubscribedCount, tint: "text-gray-500" },
          { label: "Bounced", value: kpis.bouncedCount, tint: "text-red-600" },
          { label: "Nouveaux (24h)", value: kpis.newToday, tint: "text-gray-900" },
          { label: "Nouveaux (7j)", value: kpis.new7d, tint: "text-gray-900" },
          { label: "Nouveaux (30j)", value: kpis.new30d, tint: "text-gray-900" },
          { label: "Emails envoyés (mois)", value: kpis.emailsSentThisMonth, tint: "text-gray-900" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`text-2xl font-bold ${k.tint}`}>{k.value.toLocaleString("fr-FR")}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xl font-bold text-blue-600">{kpis.confirmationRate}%</div>
          <div className="text-xs text-gray-500 mt-0.5">Taux de confirmation (double opt-in)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xl font-bold text-orange-600">{kpis.unsubscribeRate}%</div>
          <div className="text-xs text-gray-500 mt-0.5">Taux de désinscription</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xl font-bold text-purple-600">{kpis.openRate}%</div>
          <div className="text-xs text-gray-500 mt-0.5">Taux d&apos;ouverture (pixel)</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {(["subscribers", "logs"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${tab === t ? "bg-white text-[#0A2D6E] shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            {t === "subscribers" ? "Abonnés" : "Historique des envois"}
          </button>
        ))}
      </div>

      {tab === "subscribers" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white">
              <option value="">Tous types</option>
              <option value="offres">Offres</option>
              <option value="concours">Concours</option>
              <option value="remote">Remote</option>
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white">
              <option value="">Tous statuts</option>
              <option value="active">Actif</option>
              <option value="unsubscribed">Désinscrit</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Filtres</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Statut</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Confirmé</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Inscrit</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Emails reçus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscribers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Aucun abonné</td></tr>
                ) : subscribers.map((s) => {
                  const st = STATUS_LABELS[s.status] || STATUS_LABELS.active;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{s.emailMasked}</td>
                      <td className="px-4 py-2.5 text-gray-600">{TYPE_LABELS[s.alertType] || s.alertType}</td>
                      <td className="px-4 py-2.5 text-gray-500 max-w-[220px] truncate">{describeFilters(s.filters)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {s.confirmed ? <span className="text-green-600">✓</span> : <span className="text-amber-500">en attente</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">{relTime(s.createdAt)}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.emailsSentCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            <span>{subTotal} abonné(s) au total</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2.5 py-1 border border-gray-200 rounded-lg disabled:opacity-40">← Préc.</button>
              <span>Page {page}</span>
              <button disabled={page * 25 >= subTotal} onClick={() => setPage((p) => p + 1)} className="px-2.5 py-1 border border-gray-200 rounded-lg disabled:opacity-40">Suiv. →</button>
            </div>
          </div>
        </div>
      )}

      {tab === "logs" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Historique des envois</h3>
            <p className="text-xs text-gray-500 mt-0.5">Chaque ligne = un email envoyé (ou tenté) à un abonné.</p>
          </div>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Offres incluses</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Statut</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-700">Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Aucun envoi enregistré</td></tr>
                ) : logs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{relTime(l.sentAt)}</td>
                    <td className="px-4 py-2.5 text-gray-700">{TYPE_LABELS[l.alertType] || l.alertType}</td>
                    <td className="px-4 py-2.5 text-gray-500">{l.offersIncluded.length}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${l.status === "sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {l.status === "sent" ? "Envoyé" : l.status === "bounced" ? "Bounced" : "Échoué"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{l.errorReason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
