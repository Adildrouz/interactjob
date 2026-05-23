"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardStats {
  pendingJobs: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ pendingJobs: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    // Check auth
    const authRes = await fetch("/api/admin/jobs");
    if (authRes.status === 401) {
      router.push("/admin/login");
      return;
    }

    // Fetch jobs data
    const jobsRes = await fetch("/api/admin/jobs");
    if (jobsRes.ok) {
      const data = await jobsRes.json();
      const pending = data.jobs.filter((j: any) => j.status === "pending").length;
      setStats({ pendingJobs: pending });
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 text-lg">Admin Dashboard</span>
            <span className="text-xs text-gray-400">InteractJob.ma</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Site</a>
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-600 transition-colors">Déconnexion</button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord</h1>

        {loading ? (
          <div className="text-center text-gray-500">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pending Jobs Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Offres en attente</h3>
                  <p className="text-3xl font-bold text-amber-600">{stats.pendingJobs}</p>
                </div>
                <span className="text-3xl">⏳</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {stats.pendingJobs === 0
                  ? "Aucune offre en attente de validation"
                  : `${stats.pendingJobs} offre${stats.pendingJobs > 1 ? "s" : ""} à traiter`}
              </p>
              <Link
                href="/admin/offres"
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors"
              >
                Voir les offres →
              </Link>
            </div>

            {/* Candidates Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Pool Candidats</h3>
                  <p className="text-3xl font-bold text-blue-600">Gérer</p>
                </div>
                <span className="text-3xl">👥</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Accédez à la base de candidats et gérez les demandes
              </p>
              <Link
                href="/admin/candidats"
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Voir les candidats →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
