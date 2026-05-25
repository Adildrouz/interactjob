"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ICandidate as Candidate } from "@/lib/models/Candidate";
import jobsData from "@/data/jobs.json";
import type { Job } from "@/types";

const STATUTS = ["Nouveau","Contacté","En cours","Placé","Refusé"];
const STATUT_COLORS: Record<string,string> = {
  "Nouveau":   "bg-blue-100 text-blue-700",
  "Contacté":  "bg-yellow-100 text-yellow-700",
  "En cours":  "bg-purple-100 text-purple-700",
  "Placé":     "bg-green-100 text-green-700",
  "Refusé":    "bg-red-100 text-red-700",
};
const DISPO_COLORS: Record<string,string> = {
  "Immédiate":    "bg-green-100 text-green-700",
  "Sous 1 mois":  "bg-orange-100 text-orange-700",
  "Sous 3 mois":  "bg-amber-100 text-amber-700",
  "À négocier":   "bg-gray-100 text-gray-600",
};

type Filters = {
  search: string; city: string; sector: string; exp: string; dispo: string;
  status: string; starred: boolean; unviewed: boolean;
};
const initFilters: Filters = { search:"", city:"", sector:"", exp:"", dispo:"", status:"", starred:false, unviewed:false };

const allJobs = jobsData as (Job & { slug?: string })[];

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
  if (diff < 86400*7) return `il y a ${Math.floor(diff/86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

function initials(c: Candidate) {
  return `${c.firstName[0]||""}${c.lastName[0]||""}`.toUpperCase();
}

function hashColor(str: string) {
  const colors = ["#2563EB","#7C3AED","#DB2777","#EA580C","#16A34A","#0891B2","#9333EA","#DC2626"];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

export default function CandidatsPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filters, setFilters]       = useState<Filters>(initFilters);
  const [selected, setSelected]     = useState<Candidate | null>(null);
  const [notes, setNotes]           = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestSending, setSuggestSending] = useState(false);
  const [selectedJob, setSelectedJob] = useState<(Job & { slug?: string }) | null>(null);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchCandidates = useCallback(async () => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k,v]) => { if (v !== "" && v !== false) p.set(k, String(v)); });
    const res = await fetch(`/api/admin/candidates?${p}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setCandidates(data.candidates || []);
    setLoading(false);
  }, [filters, router]);

  useEffect(() => { setLoading(true); fetchCandidates(); }, [fetchCandidates]);

  async function patch(id: string, updates: Partial<Candidate>) {
    const res = await fetch(`/api/admin/candidates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return;
    const { candidate } = await res.json();
    setCandidates(cs => cs.map(c => c.id === id ? candidate : c));
    if (selected?.id === id) setSelected(candidate);
  }

  function openPanel(c: Candidate) {
    setSelected(c);
    setNotes(c.notes || "");
    if (!c.viewed) patch(c.id, { viewed: true });
  }

  function handleNotesChange(val: string) {
    setNotes(val);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      if (selected) patch(selected.id, { notes: val });
    }, 800);
  }

  async function sendSuggest() {
    if (!selected || !selectedJob) return;
    setSuggestSending(true);
    await fetch(`/api/admin/candidates/${selected.id}/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job: selectedJob }),
    });
    setSuggestSending(false);
    setSuggestOpen(false);
    setSelectedJob(null);
    alert(`Email envoyé à ${selected.firstName} pour l'offre "${selectedJob.title}"`);
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  const total    = candidates.length;
  const nouveaux = candidates.filter(c => { const d = (Date.now() - new Date(c.submittedAt).getTime()) / 86400000; return d <= 7; }).length;
  const nonVus   = candidates.filter(c => !c.viewed).length;
  const favoris  = candidates.filter(c => c.starred).length;

  const uniqueVilles   = [...new Set(candidates.map(c => c.city))].sort();
  const uniqueSecteurs = [...new Set(candidates.flatMap(c => c.sectors))].sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 text-lg">Pool Candidats</span>
            <span className="text-xs text-gray-400">InteractJob.ma</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/admin/candidates/export" className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-semibold transition-colors">
              ⬇ Exporter CSV
            </a>
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Site</a>
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-600 transition-colors">Déconnexion</button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: total,    color: "text-gray-900" },
            { label: "Nouveaux (7j)", value: nouveaux, color: "text-blue-600" },
            { label: "Non vus", value: nonVus,  color: "text-orange-600" },
            { label: "Favoris ⭐", value: favoris, color: "text-yellow-500" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Nom, email, poste..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
            />
            {[
              { key: "city",   label: "Ville",        opts: uniqueVilles },
              { key: "sector", label: "Secteur",      opts: uniqueSecteurs },
              { key: "exp",    label: "Expérience",   opts: ["Stage","Junior","Intermédiaire","Senior","Expert"] },
              { key: "dispo",  label: "Disponibilité",opts: ["Immédiate","Sous 1 mois","Sous 3 mois","À négocier"] },
              { key: "status", label: "Statut",       opts: STATUTS },
            ].map(f => (
              <select
                key={f.key}
                value={(filters as unknown as Record<string,string>)[f.key]}
                onChange={e => setFilters(ff => ({ ...ff, [f.key]: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{f.label}</option>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={filters.unviewed} onChange={e => setFilters(f => ({ ...f, unviewed: e.target.checked }))} className="rounded" />
              Non vus
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={filters.starred} onChange={e => setFilters(f => ({ ...f, starred: e.target.checked }))} className="rounded" />
              Favoris ⭐
            </label>
            {Object.values(filters).some(v => v !== "" && v !== false) && (
              <button onClick={() => setFilters(initFilters)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                ✕ Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Chargement...</div>
          ) : candidates.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">Aucun candidat trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Candidat</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Poste</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Ville / Exp</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Dispo</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {candidates.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => openPanel(c)}
                      className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${selected?.id === c.id ? "bg-blue-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {!c.viewed && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" title="Non vu" />}
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: hashColor(c.id) }}>
                            {initials(c)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{c.firstName} {c.lastName}</p>
                            <p className="text-xs text-gray-400 truncate">{c.email}</p>
                            <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="text-xs text-primary hover:underline">{c.phone}</a>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 truncate max-w-[160px]">{c.position}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.sectors.slice(0,2).map(s => (
                            <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{s}</span>
                          ))}
                          {c.sectors.length > 2 && <span className="text-[10px] text-gray-400">+{c.sectors.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{c.city}</p>
                        <p className="text-xs text-gray-400">{c.experienceLevel}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${DISPO_COLORS[c.availability] || "bg-gray-100 text-gray-600"}`}>
                          {c.availability}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-500 whitespace-nowrap">{relTime(c.submittedAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={c.status}
                          onClick={e => e.stopPropagation()}
                          onChange={e => { e.stopPropagation(); patch(c.id, { status: e.target.value }); }}
                          className={`text-xs px-2 py-1 rounded-lg font-semibold border-0 cursor-pointer focus:outline-none ${STATUT_COLORS[c.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={e => { e.stopPropagation(); openPanel(c); }} title="Voir" className="text-gray-400 hover:text-primary transition-colors">👁</button>
                          <button onClick={e => { e.stopPropagation(); patch(c.id, { starred: !c.starred }); }} title="Favori" className={`transition-colors ${c.starred ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}>⭐</button>
                          {c.cvPath && (
                            <a href={c.cvPath} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} title="Télécharger CV" className="text-gray-400 hover:text-primary transition-colors">📄</a>
                          )}
                          <a href={`mailto:${c.email}?subject=InteractJob — Opportunité d'emploi`} onClick={e => e.stopPropagation()} title="Envoyer email" className="text-gray-400 hover:text-primary transition-colors">✉️</a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail slide-in panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: hashColor(selected.id) }}>
                  {initials(selected)}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{selected.firstName} {selected.lastName}</p>
                  <p className="text-xs text-gray-400">{relTime(selected.submittedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => patch(selected.id, { starred: !selected.starred })} className={`text-xl ${selected.starred ? "text-yellow-500" : "text-gray-300"}`}>⭐</button>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
              </div>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Contact info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Email</span><a href={`mailto:${selected.email}`} className="text-primary font-medium hover:underline">{selected.email}</a></div>
                <div className="flex justify-between"><span className="text-gray-500">Téléphone</span><a href={`tel:${selected.phone}`} className="text-primary font-medium hover:underline">{selected.phone}</a></div>
                <div className="flex justify-between"><span className="text-gray-500">Ville</span><span className="font-medium">{selected.city}</span></div>
                {selected.linkedin && <div className="flex justify-between"><span className="text-gray-500">LinkedIn</span><a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline truncate max-w-[180px]">Voir profil →</a></div>}
              </div>

              {/* Profile */}
              <div className="space-y-3 text-sm">
                <div><span className="text-xs text-gray-400 uppercase tracking-wider">Poste recherché</span><p className="font-semibold text-gray-900 mt-0.5">{selected.position}</p></div>
                <div><span className="text-xs text-gray-400 uppercase tracking-wider">Secteurs</span><div className="flex flex-wrap gap-1.5 mt-1">{selected.sectors.map(s => <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s}</span>)}</div></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-xs text-gray-400 uppercase tracking-wider">Expérience</span><p className="font-medium mt-0.5">{selected.experienceLevel}</p></div>
                  <div><span className="text-xs text-gray-400 uppercase tracking-wider">Disponibilité</span><p className="font-medium mt-0.5">{selected.availability}</p></div>
                </div>
                {selected.languages.length > 0 && <div><span className="text-xs text-gray-400 uppercase tracking-wider">Langues</span><p className="mt-0.5">{selected.languages.join(", ")}</p></div>}
                <div><span className="text-xs text-gray-400 uppercase tracking-wider">À propos</span><p className="text-gray-700 mt-1 leading-relaxed text-sm bg-gray-50 rounded-xl p-3">{selected.about}</p></div>
              </div>

              {/* CV */}
              {selected.cvPath && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Curriculum Vitae</p>
                  <iframe src={selected.cvPath} className="w-full h-64 rounded-xl border border-gray-200" title="CV" />
                  <a href={selected.cvPath} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-primary hover:underline mt-2">📄 Ouvrir en plein écran</a>
                </div>
              )}

              {/* Status */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Statut</p>
                <select
                  value={selected.status}
                  onChange={e => patch(selected.id, { status: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">Notes internes <span className="normal-case text-gray-300">(sauvegarde auto)</span></p>
                <textarea
                  value={notes}
                  onChange={e => handleNotesChange(e.target.value)}
                  rows={4}
                  placeholder="Ajoutez des notes sur ce candidat..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>

            {/* Panel footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex gap-3">
              <a
                href={`mailto:${selected.email}?subject=InteractJob — Opportunité d'emploi pour ${selected.position}`}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                ✉️ Envoyer un email
              </a>
              <button
                onClick={() => setSuggestOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 border border-primary text-primary py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                💼 Suggérer une offre
              </button>
            </div>
          </div>
        </>
      )}

      {/* Suggest job modal */}
      {suggestOpen && selected && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Suggérer une offre à {selected.firstName}</h3>
              <button onClick={() => { setSuggestOpen(false); setSelectedJob(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2 mb-4">
              {allJobs.filter(j => !j.expired).slice(0, 30).map(j => (
                <div
                  key={j.id}
                  onClick={() => setSelectedJob(j)}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors ${selectedJob?.id === j.id ? "border-primary bg-blue-50" : "border-gray-100 hover:border-gray-300"}`}
                >
                  <p className="font-semibold text-sm text-gray-900">{j.title}</p>
                  <p className="text-xs text-gray-400">{j.company} · {j.city} · {j.contractType}</p>
                </div>
              ))}
            </div>
            <button
              onClick={sendSuggest}
              disabled={!selectedJob || suggestSending}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {suggestSending ? "Envoi..." : "Envoyer la suggestion →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
