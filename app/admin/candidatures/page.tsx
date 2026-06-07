"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  sectors?: string[];
  position?: string;
  experienceLevel?: string;
  availability?: string;
  status?: string;
  submittedAt?: string;
  starred?: boolean;
  viewed?: boolean;
}

function relTime(iso?: string) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function CandidaturesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/candidates")
      .then(res => {
        if (res.status === 401) { router.push("/admin/login"); return null; }
        return res.json();
      })
      .then(d => {
        if (d) {
          if (d.error) setError(d.error);
          setCandidates(d.candidates || []);
        }
        setLoading(false);
      });
  }, [router]);

  const filtered = candidates.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.city || "").toLowerCase().includes(q)
    );
  });

  const thisWeek = candidates.filter(c => {
    if (!c.submittedAt) return false;
    return (Date.now() - new Date(c.submittedAt).getTime()) < 7 * 86400000;
  }).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidatures</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {candidates.length} total · {thisWeek} cette semaine
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/candidats"
            className="px-4 py-2 text-sm font-semibold text-[#0A2D6E] border border-[#0A2D6E] rounded-lg hover:bg-blue-50 transition-colors"
          >
            Vue complète
          </Link>
          <a
            href="/api/admin/candidates/export"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#0A2D6E] rounded-lg hover:bg-[#0d3a8e] transition-colors"
          >
            Exporter CSV
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Erreur: {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par nom, email, ville…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00BCD4]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Candidat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Ville</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Secteur(s)</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Dispo</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.starred && <span className="text-amber-400 text-xs">★</span>}
                        <div>
                          <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                          {c.position && <p className="text-xs text-gray-400">{c.position}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.email}</td>
                    <td className="px-4 py-3 text-gray-600">{c.city || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px] truncate">{(c.sectors || []).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{c.availability || "—"}</td>
                    <td className="px-4 py-3">
                      {c.status ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{c.status}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{relTime(c.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                {candidates.length === 0 ? "Aucun candidat pour le moment" : "Aucun résultat"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
