"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast, useConfirm } from "../components/AdminShell";

interface Job {
  id: string;
  slug?: string;
  title: string;
  company: string;
  city: string;
  sector: string;
  contractType?: string;
  contract_type?: string;
  description: string;
  requirements?: string;
  salary?: string;
  featured?: boolean;
  sponsored?: boolean;
  sponsoredUntil?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  source?: string;
  postedAt?: string;
  submittedAt?: string;
  status?: string;
  views?: number;
  applications?: number;
}

type ViewMode = "pending" | "all" | "direct";

function relTime(iso?: string) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function OffresPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [view, setView] = useState<ViewMode>("pending");
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchPending = useCallback(async () => {
    const res = await fetch("/api/admin/jobs");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const d = await res.json();
    setPendingJobs(d.jobs || []);
  }, [router]);

  const fetchAll = useCallback(async () => {
    const res = await fetch("/api/admin/jobs/all");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const d = await res.json();
    setAllJobs(d.jobs || []);
  }, [router]);

  useEffect(() => {
    async function load() {
      await Promise.all([fetchPending(), fetchAll()]);
      setLoading(false);
    }
    load();
  }, [fetchPending, fetchAll]);

  async function approveJob(job: Job) {
    setActionId(job.id);
    const res = await fetch(`/api/admin/jobs/approve/${job.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job }),
    });
    if (res.ok) {
      toast(`Offre approuvée — email envoyé à ${job.applicantEmail}`, "success");
      setPendingJobs(p => p.filter(j => j.id !== job.id));
      setSelectedJob(null);
      fetchAll();
    } else {
      toast("Erreur lors de l'approbation", "error");
    }
    setActionId(null);
  }

  async function rejectJob(job: Job) {
    const ok = await confirm({ title: "Refuser l'offre ?", message: `Un email sera envoyé à ${job.applicantEmail}.`, danger: true });
    if (!ok) return;
    setActionId(job.id);
    const res = await fetch(`/api/admin/jobs/reject/${job.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job }),
    });
    if (res.ok) {
      toast("Offre refusée", "info");
      setPendingJobs(p => p.filter(j => j.id !== job.id));
      setSelectedJob(null);
    } else {
      toast("Erreur lors du refus", "error");
    }
    setActionId(null);
  }

  async function deleteJob(job: Job) {
    const ok = await confirm({ title: "Supprimer l'offre ?", message: `"${job.title}" sera retirée définitivement du site.`, danger: true });
    if (!ok) return;
    setActionId(job.id);
    const res = await fetch(`/api/admin/jobs/delete/${job.id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Offre supprimée", "success");
      setAllJobs(j => j.filter(x => x.id !== job.id));
    } else {
      toast("Erreur lors de la suppression", "error");
    }
    setActionId(null);
  }

  async function sponsorJob(job: Job) {
    const ok = await confirm({ title: "Sponsoriser cette offre ?", message: `"${job.title}" sera mise en avant pendant 30 jours.` });
    if (!ok) return;
    setActionId(job.id);
    const res = await fetch(`/api/admin/jobs/sponsor/${job.id}`, { method: "POST" });
    if (res.ok) {
      toast("Offre sponsorisée 30 jours", "success");
      await fetchAll();
    } else {
      toast("Erreur lors de la sponsorisation", "error");
    }
    setActionId(null);
  }

  const pending = pendingJobs.filter(j => j.status === "pending");
  const directJobs = allJobs.filter(j => j.source === "Direct");
  const filteredAll = (view === "direct" ? directJobs : allJobs).filter(j =>
    !search ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Offres</h1>
        <a
          href="/admin/offres/ajouter"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A2D6E] text-white text-sm font-semibold rounded-lg hover:bg-[#0d3a8e] transition-colors"
        >
          + Ajouter une offre
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setView("pending")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            view === "pending" ? "bg-white text-[#0A2D6E] shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          En attente {pending.length > 0 && <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">{pending.length}</span>}
        </button>
        <button
          onClick={() => setView("all")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            view === "all" ? "bg-white text-[#0A2D6E] shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Toutes les offres <span className="ml-1 text-gray-400 text-xs">({allJobs.length})</span>
        </button>
        <button
          onClick={() => setView("direct")}
          className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            view === "direct" ? "bg-white text-[#0A2D6E] shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🤝 Directes <span className="ml-1 text-gray-400 text-xs">({directJobs.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>
      ) : view === "pending" ? (
        /* ── Pending jobs ── */
        pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-3">✨</div>
            <p className="text-gray-500 font-medium">Aucune offre en attente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(job => (
              <div key={job.id} className={`bg-white rounded-xl border p-4 flex items-start gap-4 ${job.featured ? "border-amber-200" : "border-gray-200"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    {job.featured && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Sponsorisée</span>}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{job.company} · {job.city}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {relTime(job.submittedAt)} · {job.applicantEmail}
                    {job.applicantPhone && <> · <a href={`tel:${job.applicantPhone.replace(/\s/g, "")}`} className="text-primary hover:underline">📞 {job.applicantPhone}</a></>}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setSelectedJob(job)} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    Voir
                  </button>
                  <button
                    onClick={() => approveJob(job)}
                    disabled={actionId === job.id}
                    className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✅ Approuver
                  </button>
                  <button
                    onClick={() => rejectJob(job)}
                    disabled={actionId === job.id}
                    className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    ❌ Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── All published jobs ── */
        <div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher par titre ou entreprise…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
            />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Titre</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Entreprise</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Ville</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">👁 Vues</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">📩 Candid.</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAll.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{job.title}</td>
                      <td className="px-4 py-3 text-gray-600">{job.company}</td>
                      <td className="px-4 py-3 text-gray-600">{job.city}</td>
                      <td className="px-4 py-3">
                        {job.sponsored ? (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Sponsorisée</span>
                        ) : job.source === "Direct" ? (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">🤝 Directe</span>
                        ) : (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Standard</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{relTime(job.postedAt || job.submittedAt)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-gray-700">{job.views ?? 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(job.applications ?? 0) > 0 ? (
                          <a href={`/admin/offres/${job.slug || job.id}`} className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#00347A] text-white text-xs font-bold hover:bg-[#00C2CB] transition-colors">
                            {job.applications}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {!job.sponsored && (
                            <button
                              onClick={() => sponsorJob(job)}
                              disabled={actionId === job.id}
                              className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                              ⭐ Sponsor
                            </button>
                          )}
                          <button
                            onClick={() => deleteJob(job)}
                            disabled={actionId === job.id}
                            className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAll.length === 0 && (
                <div className="py-12 text-center text-gray-400">Aucune offre trouvée</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job detail modal (pending) */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">{selectedJob.title}</h2>
              <button onClick={() => setSelectedJob(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500 font-medium">Entreprise</p><p className="text-gray-900">{selectedJob.company}</p></div>
                <div><p className="text-gray-500 font-medium">Ville</p><p className="text-gray-900">{selectedJob.city}</p></div>
                <div><p className="text-gray-500 font-medium">Secteur</p><p className="text-gray-900">{selectedJob.sector}</p></div>
                <div><p className="text-gray-500 font-medium">Contrat</p><p className="text-gray-900">{selectedJob.contractType}</p></div>
                {selectedJob.salary && <div><p className="text-gray-500 font-medium">Salaire</p><p className="text-gray-900">{selectedJob.salary}</p></div>}
                <div><p className="text-gray-500 font-medium">Email</p><p className="text-gray-900 text-xs">{selectedJob.applicantEmail}</p></div>
                {selectedJob.applicantPhone && <div><p className="text-gray-500 font-medium">Téléphone</p><p className="text-gray-900 text-xs">{selectedJob.applicantPhone}</p></div>}
              </div>
              <div>
                <p className="text-gray-500 font-medium text-sm mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.description}</p>
              </div>
              {selectedJob.requirements && (
                <div>
                  <p className="text-gray-500 font-medium text-sm mb-1">Profil recherché</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedJob.requirements}</p>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setSelectedJob(null)} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Fermer
              </button>
              <button
                onClick={() => rejectJob(selectedJob)}
                disabled={actionId === selectedJob.id}
                className="px-4 py-2 text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
              >
                ❌ Refuser
              </button>
              <button
                onClick={() => approveJob(selectedJob)}
                disabled={actionId === selectedJob.id}
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
