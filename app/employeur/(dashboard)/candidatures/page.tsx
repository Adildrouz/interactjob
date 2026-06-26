'use client';
import { useState, useEffect, useCallback } from 'react';

const STATUS_LABELS: Record<string, string> = {
  nouveau: 'Nouveau', vu: 'Vu', preselectionne: 'Présélectionné', refuse: 'Refusé',
};
const STATUS_COLORS: Record<string, string> = {
  nouveau: 'bg-blue-100 text-blue-700',
  vu: 'bg-gray-100 text-gray-600',
  preselectionne: 'bg-green-100 text-green-700',
  refuse: 'bg-red-100 text-red-600',
};

export default function Candidatures() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [offerFilter, setOfferFilter] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const url = offerFilter
      ? `/api/employer/applications?offer=${offerFilter}`
      : '/api/employer/applications';
    const res = await fetch(url);
    const data = await res.json();
    setApplications(data.applications || []);
    setLoading(false);
  }, [offerFilter]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/employer/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setApplications(apps => apps.map(a => a._id === id ? { ...a, status } : a));
    setUpdating(null);
  }

  function exportCSV() {
    const headers = ['Nom', 'Email', 'Offre', 'Statut', 'Date', 'Profil testé'];
    const rows = filtered.map(a => [
      a.candidate_name, a.email, a.offer_title,
      STATUS_LABELS[a.status] || a.status,
      new Date(a.created_at).toLocaleDateString('fr-FR'),
      a.personality_profile?.mbti ? `Oui (${a.personality_profile.mbti})` : 'Non',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'candidatures.csv'; a.click();
  }

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  // Unique offers for filter
  const offers = [...new Map(applications.map(a => [a.offer_id?.toString(), a.offer_title])).entries()]
    .filter(([id]) => id);

  if (loading) return <div className="text-gray-400 text-sm">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#00347A]">Candidatures</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} candidature{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={exportCSV}
          className="text-sm border border-[#D0E4F0] hover:border-[#00C2CB] text-gray-600 px-4 py-2 rounded-xl transition">
          ↓ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {['all', 'nouveau', 'vu', 'preselectionne', 'refuse'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                filter === s ? 'bg-[#00347A] text-white' : 'border border-[#D0E4F0] text-gray-600 hover:bg-[#F0F8FF]'
              }`}>
              {s === 'all' ? 'Tous' : STATUS_LABELS[s]}
              {s !== 'all' && (
                <span className="ml-1 opacity-60">
                  ({applications.filter(a => a.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>
        {offers.length > 1 && (
          <select value={offerFilter} onChange={e => setOfferFilter(e.target.value)}
            className="text-xs border border-[#D0E4F0] rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
            <option value="">Toutes les offres</option>
            {offers.map(([id, title]) => (
              <option key={id} value={id as string}>{title as string}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D0E4F0] p-12 text-center">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-gray-500">Aucune candidature pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any) => (
            <div key={app._id} className="bg-white rounded-2xl border border-[#D0E4F0] overflow-hidden">
              {/* Header row */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{app.candidate_name}</span>
                    {app.personality_profile?.mbti && (
                      <span className="text-xs bg-[#E0F9FA] text-[#007A80] font-bold px-2 py-0.5 rounded-full border border-[#A0E8EC]">
                        ✓ Profil testé · {app.personality_profile.mbti}
                      </span>
                    )}
                    {app.personality_profile?.disc && (
                      <span className="text-xs text-gray-500">{app.personality_profile.disc}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                    <span>📧 {app.email}</span>
                    <span>📋 {app.offer_title}</span>
                    <span>📅 {new Date(app.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={app.status}
                    disabled={updating === app._id}
                    onChange={e => updateStatus(app._id, e.target.value)}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-[#00C2CB] disabled:opacity-50 ${STATUS_COLORS[app.status]}`}>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <button onClick={() => setExpanded(expanded === app._id ? null : app._id)}
                    className="text-xs border border-[#D0E4F0] hover:border-[#00C2CB] px-3 py-1.5 rounded-lg text-gray-600 transition">
                    {expanded === app._id ? 'Masquer' : 'Détails'}
                  </button>
                  {app.cv_url && (
                    <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-[#00347A] hover:bg-[#00285e] text-white px-3 py-1.5 rounded-lg transition">
                      CV ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expanded === app._id && (
                <div className="border-t border-[#D0E4F0] p-5 bg-[#F8FBFF] space-y-4">
                  {app.cover_letter && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Lettre de motivation</p>
                      <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{app.cover_letter}</p>
                    </div>
                  )}
                  {app.personality_profile?.mbti && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Profil de personnalité</p>
                      <div className="flex flex-wrap gap-3">
                        <span className="bg-[#E0F9FA] text-[#007A80] text-sm font-bold px-3 py-1.5 rounded-xl">
                          MBTI : {app.personality_profile.mbti}
                        </span>
                        {app.personality_profile.disc && (
                          <span className="bg-purple-50 text-purple-700 text-sm font-medium px-3 py-1.5 rounded-xl">
                            DISC : {app.personality_profile.disc}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
