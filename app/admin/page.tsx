"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Stats {
  cv: { total: number; free: number; month: number; revenue: number; target: number };
  personality: {
    total: number; free: number; freeThisMonth: number;
    paid: number; paidThisMonth: number; revenue: number; target: number;
  };
  annonces: { paidThisMonth: number; revenue: number; target: number };
  services: { revenue: number; target: number };
  candidates: number;
  jobs: { total: number; rss: number; employer: number };
  revenue: { mad: number; target: number; progress: number; decemberTarget: number };
}

interface Job {
  id: string;
  title: string;
  company: string;
  city: string;
  sponsored?: boolean;
  featured?: boolean;
  status?: string;
  postedAt?: string;
  submittedAt?: string;
  source?: string;
}

function relTime(iso?: string) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

function ProgressBar({ value, color = "bg-green-500" }: { value: number; color?: string }) {
  return (
    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

function ServiceCard({ label, revenue, target, subtitle }: { label: string; revenue: number; target: number; subtitle: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((revenue / target) * 100)) : 0;
  const color = pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-amber-400" : "bg-blue-400";
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xl font-bold text-green-600">{revenue.toLocaleString("fr-FR")} MAD</p>
        <p className="text-xs text-gray-400">/ {target.toLocaleString("fr-FR")}</p>
      </div>
      <ProgressBar value={pct} color={color} />
      <p className="text-xs text-gray-400 mt-1">{pct}% · {subtitle}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<Job[]>([]);
  const [published, setPublished] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [statsRes, jobsRes, allRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/jobs"),
        fetch("/api/admin/jobs/all"),
      ]);

      if (statsRes.status === 401 || jobsRes.status === 401) {
        router.push("/admin/login");
        return;
      }

      if (statsRes.ok) setStats(await statsRes.json());
      if (jobsRes.ok) {
        const d = await jobsRes.json();
        setPending((d.jobs || []).filter((j: Job) => j.status === "pending"));
      }
      if (allRes.ok) {
        const d = await allRes.json();
        setPublished(d.jobs || []);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const now = new Date();
  const monthLabel = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <span className="text-sm text-gray-500">
          {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Offres publiées — RSS vs Employeur */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Offres publiées</p>
              <p className="text-3xl font-bold text-[#0A2D6E]">{stats?.jobs.total ?? published.length}</p>
              <div className="flex gap-3 mt-2">
                <span className="text-xs text-gray-400">📡 RSS : <b className="text-gray-600">{stats?.jobs.rss ?? "—"}</b></span>
                <span className="text-xs text-gray-400">🏢 Employeur : <b className="text-amber-600">{stats?.jobs.employer ?? "—"}</b></span>
              </div>
              <Link href="/admin/offres?tab=all" className="mt-1 text-xs text-[#00BCD4] font-medium hover:underline block">Gérer →</Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">En attente</p>
              <p className={`text-3xl font-bold ${pending.length > 0 ? "text-amber-600" : "text-gray-400"}`}>{pending.length}</p>
              {pending.length > 0 && (
                <Link href="/admin/offres" className="mt-2 text-xs text-amber-600 font-medium hover:underline block">Traiter →</Link>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Talent Pool</p>
              <p className="text-3xl font-bold text-[#0A2D6E]">{stats?.candidates ?? 0}</p>
              <Link href="/admin/candidats" className="mt-2 text-xs text-[#00BCD4] font-medium hover:underline block">Voir →</Link>
            </div>

            {/* CV Checker */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">CV Checker</p>
              <p className="text-3xl font-bold text-[#0A2D6E]">{stats?.cv.total ?? 0}</p>
              <p className="text-xs text-gray-400 mt-1">🆓 Gratuit : <b>{stats?.cv.free ?? 0}</b> · ce mois : {stats?.cv.month ?? 0}</p>
            </div>
          </div>

          {/* ── Usage Free / Payant ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Personality test */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Test de personnalité</p>
              <div className="flex items-end gap-6 mb-3">
                <div>
                  <p className="text-2xl font-bold text-[#0A2D6E]">{stats?.personality.total ?? 0}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-500">{stats?.personality.free ?? 0}</p>
                  <p className="text-xs text-gray-400">🆓 Gratuit</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-amber-600">{stats?.personality.paid ?? 0}</p>
                  <p className="text-xs text-gray-400">💎 Premium</p>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${stats?.personality.total ? Math.round((stats.personality.paid / stats.personality.total) * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {stats?.personality.total ? Math.round((stats.personality.paid / stats.personality.total) * 100) : 0}% conversion premium
                · Ce mois : 🆓 {stats?.personality.freeThisMonth ?? 0} / 💎 {stats?.personality.paidThisMonth ?? 0}
              </p>
            </div>

            {/* CV Checker breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">CV Checker — répartition</p>
              <div className="flex items-end gap-6 mb-3">
                <div>
                  <p className="text-2xl font-bold text-[#0A2D6E]">{stats?.cv.total ?? 0}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-500">{stats?.cv.free ?? 0}</p>
                  <p className="text-xs text-gray-400">🆓 Gratuit</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-[#00BCD4]">{stats?.cv.month ?? 0}</p>
                  <p className="text-xs text-gray-400">📅 Ce mois</p>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                {["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"].slice(0, now.getMonth() + 1).map((m, i) => (
                  <div key={i} className="flex-1 bg-[#00BCD4]/20 rounded h-6 flex items-end">
                    <div className="w-full bg-[#00BCD4] rounded" style={{ height: i === now.getMonth() ? "100%" : "40%" }} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">Tous les checks sont gratuits — le rapport premium est à venir</p>
            </div>
          </div>

          {/* ── Revenue — per service monthly targets ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Revenus — {monthLabel}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Objectif Décembre 2026 : <span className="font-semibold text-gray-600">{(stats?.revenue.decemberTarget ?? 48730).toLocaleString("fr-FR")} MAD</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{(stats?.revenue.mad ?? 0).toLocaleString("fr-FR")} MAD</p>
                <p className="text-xs text-gray-400">/ {(stats?.revenue.target ?? 0).toLocaleString("fr-FR")} MAD ce mois</p>
              </div>
            </div>
            <ProgressBar value={stats?.revenue.progress ?? 0} color="bg-green-500" />
            <p className="text-xs text-gray-500 mb-4 mt-1">{stats?.revenue.progress ?? 0}% de l'objectif mensuel atteint</p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <ServiceCard
                label="CV Builder"
                revenue={stats?.cv.revenue ?? 0}
                target={stats?.cv.target ?? 0}
                subtitle={`${stats?.cv.month ?? 0} checks ce mois`}
              />
              <ServiceCard
                label="Test Personnalité"
                revenue={stats?.personality.revenue ?? 0}
                target={stats?.personality.target ?? 0}
                subtitle={`${stats?.personality.paidThisMonth ?? 0} premium · 49 MAD`}
              />
              <ServiceCard
                label="Annonces payantes"
                revenue={stats?.annonces.revenue ?? 0}
                target={stats?.annonces.target ?? 0}
                subtitle={`${stats?.annonces.paidThisMonth ?? 0} annonces · 990 MAD`}
              />
              <ServiceCard
                label="Services entreprises"
                revenue={stats?.services.revenue ?? 0}
                target={stats?.services.target ?? 0}
                subtitle="Partenariats RH"
              />
            </div>
          </div>

          {/* ── Published jobs list ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Offres publiées récentes</h2>
              <Link href="/admin/offres?tab=all" className="text-sm text-[#00BCD4] font-medium hover:underline">Tout voir →</Link>
            </div>
            {published.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Aucune offre publiée</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs font-semibold text-gray-500">Titre</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500">Entreprise</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500">Ville</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500">Type</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {published.slice(0, 10).map(j => (
                      <tr key={j.id} className="hover:bg-gray-50">
                        <td className="py-2.5 pr-3 font-medium text-gray-900 max-w-[200px] truncate">{j.title}</td>
                        <td className="py-2.5 pr-3 text-gray-600 truncate max-w-[140px]">{j.company}</td>
                        <td className="py-2.5 pr-3 text-gray-600">{j.city}</td>
                        <td className="py-2.5 pr-3">
                          {j.sponsored ? (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Sponsorisée</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Standard</span>
                          )}
                        </td>
                        <td className="py-2.5 text-gray-400 text-xs whitespace-nowrap">{relTime(j.postedAt || j.submittedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Pending jobs list ── */}
          {pending.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">
                  Offres en attente
                  <span className="ml-2 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{pending.length}</span>
                </h2>
                <Link href="/admin/offres" className="text-sm text-amber-600 font-medium hover:underline">Traiter →</Link>
              </div>
              <ul className="divide-y divide-gray-100">
                {pending.slice(0, 5).map(j => (
                  <li key={j.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{j.title}</p>
                      <p className="text-xs text-gray-500">{j.company} · {relTime(j.submittedAt)}</p>
                    </div>
                    {j.featured && (
                      <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Sponsorisée</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
