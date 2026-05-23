"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface PendingJob {
  id: string;
  title: string;
  company: string;
  city: string;
  sector: string;
  contractType: "CDI" | "CDD" | "Stage";
  description: string;
  requirements: string;
  salary?: string;
  featured: boolean;
  applicantEmail: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  sectors: string[];
  experience: number;
  availability: string;
  cv?: string;
  notes?: string;
  starred?: boolean;
  viewed?: boolean;
  submittedAt: string;
}

type TabType = "overview" | "pending" | "premium" | "talent" | "settings";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<PendingJob | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch pending jobs
      const jobsRes = await fetch("/api/admin/jobs");
      if (jobsRes.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setPendingJobs(jobsData.jobs?.filter((j: PendingJob) => j.status === "pending") || []);
      }

      // Fetch candidates
      const candidatesRes = await fetch("/api/admin/candidates");
      if (candidatesRes.ok) {
        const candidatesData = await candidatesRes.json();
        setCandidates(candidatesData.candidates || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function approveJob(job: PendingJob) {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/approve/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });

      if (res.ok) {
        alert(`✅ Offre approuvée et email envoyé à ${job.applicantEmail}`);
        setPendingJobs(pendingJobs.filter(j => j.id !== job.id));
        setModalOpen(false);
        setSelectedJob(null);
      } else {
        const errorData = await res.json();
        alert(`Erreur lors de l'approbation: ${errorData.error || "Erreur inconnue"}`);
      }
    } catch (error) {
      alert("Erreur: " + error);
    } finally {
      setActionLoading(false);
    }
  }

  async function rejectJob(job: PendingJob) {
    if (!confirm("Êtes-vous sûr de vouloir refuser cette offre?")) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/reject/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job }),
      });

      if (res.ok) {
        alert(`❌ Offre refusée`);
        setPendingJobs(pendingJobs.filter(j => j.id !== job.id));
        setModalOpen(false);
        setSelectedJob(null);
      } else {
        const errorData = await res.json();
        alert(`Erreur lors du refus: ${errorData.error || "Erreur inconnue"}`);
      }
    } catch (error) {
      alert("Erreur: " + error);
    } finally {
      setActionLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  function relTime(iso: string) {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
    return new Date(iso).toLocaleDateString("fr-FR");
  }

  // Stats
  const pendingCount = pendingJobs.length;
  const premiumCount = pendingJobs.filter(j => j.featured).length;
  const standardCount = pendingJobs.filter(j => !j.featured).length;
  const candidateCount = candidates.length;
  const newCandidates = candidates.filter(c => {
    const days = (Date.now() - new Date(c.submittedAt).getTime()) / 86400000;
    return days <= 7;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 text-lg">Admin Central</span>
            <span className="text-xs text-gray-400">InteractJob.ma</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Site</a>
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-600 transition-colors">Déconnexion</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-12 z-20">
        <div className="max-w-screen-xl mx-auto px-4 flex gap-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📊 Aperçu
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "pending"
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📋 Offres (Gratuit)
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("premium")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "premium"
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            ⭐ Offres Premium
            {premiumCount > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                {premiumCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("talent")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "talent"
                ? "border-primary text-primary"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            👥 Pool Talents
            {candidateCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                {candidateCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Pending Jobs */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Offres en attente</p>
                    <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
                  </div>
                  <span className="text-2xl">📋</span>
                </div>
                <button
                  onClick={() => setActiveTab("pending")}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700"
                >
                  Voir détails →
                </button>
              </div>

              {/* Premium Jobs */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Offres Premium</p>
                    <p className="text-3xl font-bold text-yellow-600">{premiumCount}</p>
                  </div>
                  <span className="text-2xl">⭐</span>
                </div>
                <button
                  onClick={() => setActiveTab("premium")}
                  className="text-xs font-semibold text-yellow-600 hover:text-yellow-700"
                >
                  Voir détails →
                </button>
              </div>

              {/* Standard Jobs */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Offres Standard</p>
                    <p className="text-3xl font-bold text-blue-600">{standardCount}</p>
                  </div>
                  <span className="text-2xl">📄</span>
                </div>
                <p className="text-xs text-gray-500">{standardCount} offre{standardCount !== 1 ? 's' : ''}</p>
              </div>

              {/* Candidates */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Candidats</p>
                    <p className="text-3xl font-bold text-green-600">{candidateCount}</p>
                  </div>
                  <span className="text-2xl">👥</span>
                </div>
                <p className="text-xs text-gray-500">{newCandidates} nouveau(x) cette semaine</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Pending Jobs */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Offres récentes en attente</h3>
                {pendingJobs.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune offre en attente</p>
                ) : (
                  <ul className="space-y-3">
                    {pendingJobs.slice(0, 5).map(job => (
                      <li key={job.id} className="border-l-2 border-amber-200 pl-3">
                        <p className="font-medium text-sm text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.company} • {relTime(job.submittedAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Recent Candidates */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidats récents</h3>
                {candidates.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun candidat</p>
                ) : (
                  <ul className="space-y-3">
                    {candidates.slice(0, 5).map(c => (
                      <li key={c.id} className="border-l-2 border-green-200 pl-3">
                        <p className="font-medium text-sm text-gray-900">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-500">{c.city} • {relTime(c.submittedAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PENDING JOBS TAB */}
        {activeTab === "pending" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Offres Gratuites en Attente ({pendingCount})</h2>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Chargement...</div>
            ) : pendingJobs.filter(j => !j.featured).length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="text-5xl mb-4">✨</div>
                <p className="text-gray-500">Aucune offre gratuite en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingJobs.filter(j => !j.featured).map(job => (
                  <div key={job.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{job.company} • {job.city}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{job.sector}</span>
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{job.contractType}</span>
                          <span className="text-xs px-2 py-1 rounded text-gray-500">{relTime(job.submittedAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          👁 Voir
                        </button>
                        <button
                          onClick={() => approveJob(job)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors disabled:opacity-50"
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => rejectJob(job)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PREMIUM JOBS TAB */}
        {activeTab === "premium" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">⭐ Offres Premium en Attente ({premiumCount})</h2>
            {loading ? (
              <div className="text-center py-12 text-gray-500">Chargement...</div>
            ) : pendingJobs.filter(j => j.featured).length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="text-5xl mb-4">✨</div>
                <p className="text-gray-500">Aucune offre premium en attente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingJobs.filter(j => j.featured).map(job => (
                  <div key={job.id} className="bg-white rounded-lg border-2 border-yellow-200 bg-yellow-50/50 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">⭐ {job.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{job.company} • {job.city}</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 font-semibold">Premium</span>
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{job.sector}</span>
                          <span className="text-xs px-2 py-1 rounded text-gray-500">{relTime(job.submittedAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          👁 Voir
                        </button>
                        <button
                          onClick={() => approveJob(job)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors disabled:opacity-50"
                        >
                          ✅
                        </button>
                        <button
                          onClick={() => rejectJob(job)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TALENT POOL TAB */}
        {activeTab === "talent" && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">👥 Pool Talents ({candidateCount})</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{candidateCount}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Cette semaine</p>
                <p className="text-2xl font-bold text-green-600">{newCandidates}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <a href="/admin/candidats" className="text-sm font-semibold text-primary hover:text-primary-dark">
                  Accéder à la gestion →
                </a>
              </div>
            </div>
            {candidates.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <div className="text-5xl mb-4">👥</div>
                <p className="text-gray-500">Aucun candidat pour le moment</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Nom</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Ville</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Secteurs</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-900">Exp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {candidates.slice(0, 10).map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">{c.firstName} {c.lastName}</td>
                          <td className="px-6 py-4 text-gray-600 text-xs">{c.email}</td>
                          <td className="px-6 py-4">{c.city}</td>
                          <td className="px-6 py-4 text-xs">{c.sectors.join(", ")}</td>
                          <td className="px-6 py-4">{c.experience} ans</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {modalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedJob.title}</h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedJob(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div><h3 className="font-semibold text-gray-900 mb-1">Entreprise</h3><p className="text-gray-700">{selectedJob.company}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><h3 className="font-semibold text-gray-900 mb-1">Ville</h3><p className="text-gray-700">{selectedJob.city}</p></div>
                <div><h3 className="font-semibold text-gray-900 mb-1">Secteur</h3><p className="text-gray-700">{selectedJob.sector}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><h3 className="font-semibold text-gray-900 mb-1">Type contrat</h3><p className="text-gray-700">{selectedJob.contractType}</p></div>
                <div><h3 className="font-semibold text-gray-900 mb-1">Salaire</h3><p className="text-gray-700">{selectedJob.salary || "Non spécifié"}</p></div>
              </div>
              <div><h3 className="font-semibold text-gray-900 mb-1">Email</h3><p className="text-gray-700 text-sm">{selectedJob.applicantEmail}</p></div>
              <div><h3 className="font-semibold text-gray-900 mb-1">Description</h3><p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedJob.description}</p></div>
              <div><h3 className="font-semibold text-gray-900 mb-1">Profil recherché</h3><p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedJob.requirements}</p></div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedJob(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => rejectJob(selectedJob)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
              >
                ❌ Refuser
              </button>
              <button
                onClick={() => approveJob(selectedJob)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50"
              >
                ✅ Approuver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
