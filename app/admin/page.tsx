"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Stats {
  cv: { total: number; paid: number };
  personality: { total: number; paid: number };
  candidates: number;
  revenue: { mad: number; target: number; progress: number };
}

interface PendingJob {
  id: string;
  title: string;
  company: string;
  submittedAt: string;
  featured: boolean;
  status: string;
}

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingJob[]>([]);
  const [jobTotal, setJobTotal] = useState(0);
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
        setPending((d.jobs || []).filter((j: PendingJob) => j.status === "pending"));
      }
      if (allRes.ok) {
        const d = await allRes.json();
        setJobTotal(d.total || 0);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  const newThisWeek = (n: number) => {
    // placeholder — actual breakdown requires date filtering per collection
    return n;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Chargement...</div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Offres publiées</p>
              <p className="text-3xl font-bold text-[#0A2D6E]">{jobTotal}</p>
              <Link href="/admin/offres" className="mt-2 text-xs text-[#00BCD4] font-medium hover:underline block">Gérer →</Link>
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

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Blog</p>
              <p className="text-3xl font-bold text-[#0A2D6E]">Articles</p>
              <Link href="/admin/blog" className="mt-2 text-xs text-[#00BCD4] font-medium hover:underline block">Gérer →</Link>
            </div>
          </div>

          {/* ── Revenue + Service stats ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Revenue card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Revenus du mois</p>
              <p className="text-3xl font-bold text-green-600">{(stats?.revenue.mad ?? 0).toLocaleString("fr-FR")} MAD</p>
              <p className="text-xs text-gray-400 mt-1">Objectif: {(stats?.revenue.target ?? 0).toLocaleString("fr-FR")} MAD</p>
              <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.revenue.progress ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{stats?.revenue.progress ?? 0}% atteint</p>
            </div>

            {/* CV Builder stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">CV Builder</p>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-3xl font-bold text-[#0A2D6E]">{stats?.cv.paid ?? 0}</p>
                  <p className="text-xs text-gray-400">payants</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-400">{stats?.cv.total ?? 0}</p>
                  <p className="text-xs text-gray-400">total</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Revenus: <span className="font-semibold text-green-600">{((stats?.cv.paid ?? 0) * 55).toLocaleString("fr-FR")} MAD</span>
                <span className="text-gray-400"> (55 MAD/CV)</span>
              </p>
            </div>

            {/* Personality Test stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Test Personnalité</p>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-3xl font-bold text-[#0A2D6E]">{stats?.personality.paid ?? 0}</p>
                  <p className="text-xs text-gray-400">payants</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-400">{stats?.personality.total ?? 0}</p>
                  <p className="text-xs text-gray-400">total</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Revenus: <span className="font-semibold text-green-600">{((stats?.personality.paid ?? 0) * 50).toLocaleString("fr-FR")} MAD</span>
                <span className="text-gray-400"> (50 MAD/test)</span>
              </p>
            </div>
          </div>

          {/* ── Pending jobs list ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Offres en attente de validation</h2>
              <Link href="/admin/offres" className="text-sm text-[#00BCD4] font-medium hover:underline">Tout voir →</Link>
            </div>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">Aucune offre en attente</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {pending.slice(0, 8).map(j => (
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
            )}
          </div>
        </>
      )}
    </div>
  );
}
