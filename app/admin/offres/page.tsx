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

interface Stats {
  pending: number;
  approvedThisMonth: number;
  sponsored: number;
  standard: number;
}

export default function OffresAdminPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<PendingJob[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approvedThisMonth: 0, sponsored: 0, standard: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<PendingJob | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    const res = await fetch("/api/admin/jobs");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setJobs(data.jobs || []);

    // Calculate stats
    const pending = data.jobs.filter((j: PendingJob) => j.status === "pending").length;
    const now = new Date();
    const thisMonth = data.jobs.filter((j: PendingJob) => {
      if (j.status !== "approved") return false;
      const date = new Date(j.submittedAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const sponsored = data.jobs.filter((j: PendingJob) => j.featured).length;
    const standard = data.jobs.filter((j: PendingJob) => !j.featured).length;

    setStats({ pending, approvedThisMonth: thisMonth, sponsored, standard });
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function approveJob(job: PendingJob) {
    setActionLoading(true);
    const res = await fetch(`/api/admin/jobs/approve/${job.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job }),
    });

    if (res.ok) {
      alert(`✅ Offre approuvée et email envoyé à ${job.applicantEmail}`);
      setJobs(jobs.filter(j => j.id !== job.id));
      setModalOpen(false);
      setSelectedJob(null);
      fetchJobs();
    } else {
      alert("Erreur lors de l'approbation");
    }
    setActionLoading(false);
  }

  async function rejectJob(job: PendingJob) {
    if (!confirm("Êtes-vous sûr de vouloir refuser cette offre? Un email sera envoyé à l'employeur.")) return;

    setActionLoading(true);
    const res = await fetch(`/api/admin/jobs/reject/${job.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job }),
    });

    if (res.ok) {
      alert(`❌ Offre refusée et email envoyé à ${job.applicantEmail}`);
      setJobs(jobs.filter(j => j.id !== job.id));
      setModalOpen(false);
      setSelectedJob(null);
      fetchJobs();
    } else {
      alert("Erreur lors du refus");
    }
    setActionLoading(false);
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

  const pendingJobs = jobs.filter(j => j.status === "pending");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 text-lg">Offres en attente</span>
            <span className="text-xs text-gray-400">InteractJob.ma</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Dashboard</a>
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Site</a>
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-600 transition-colors">Déconnexion</button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">En attente</div>
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Approuvées ce mois</div>
            <div className="text-2xl font-bold text-green-600">{stats.approvedThisMonth}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Sponsorisées</div>
            <div className="text-2xl font-bold text-amber-600">{stats.sponsored}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Standard</div>
            <div className="text-2xl font-bold text-blue-600">{stats.standard}</div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : pendingJobs.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-lg font-semibold text-gray-800">Aucune offre en attente</h3>
            <p className="text-gray-500 mt-2">Toutes les offres ont été traitées!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Titre du poste</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Entreprise</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Ville</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Type</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Date soumission</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Email contact</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Statut</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{job.title}</td>
                      <td className="px-6 py-4 text-gray-700">{job.company}</td>
                      <td className="px-6 py-4 text-gray-700">{job.city}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          job.featured
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {job.featured ? "Sponsorisée" : "Standard"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-xs">{relTime(job.submittedAt)}</td>
                      <td className="px-6 py-4 text-gray-700 text-xs">{job.applicantEmail}</td>
                      <td className="px-6 py-4">
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2.5 py-1 rounded-full font-semibold">
                          En attente
                        </span>
                      </td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          👁 Détails
                        </button>
                        <button
                          onClick={() => approveJob(job)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          ✅ Approuver
                        </button>
                        <button
                          onClick={() => rejectJob(job)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          ❌ Refuser
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Entreprise</h3>
                <p className="text-gray-700">{selectedJob.company}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Ville</h3>
                  <p className="text-gray-700">{selectedJob.city}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Secteur</h3>
                  <p className="text-gray-700">{selectedJob.sector}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Type contrat</h3>
                  <p className="text-gray-700">{selectedJob.contractType}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Salaire</h3>
                  <p className="text-gray-700">{selectedJob.salary || "Non spécifié"}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email de contact</h3>
                <p className="text-gray-700 text-sm">{selectedJob.applicantEmail}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedJob.description}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Profil recherché</h3>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedJob.requirements}</p>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  selectedJob.featured
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {selectedJob.featured ? "Sponsorisée" : "Standard"}
                </span>
                <span className="text-xs text-gray-500">{relTime(selectedJob.submittedAt)}</span>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center gap-3 justify-end">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedJob(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => rejectJob(selectedJob)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
              >
                ❌ Refuser
              </button>
              <button
                onClick={() => approveJob(selectedJob)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
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
