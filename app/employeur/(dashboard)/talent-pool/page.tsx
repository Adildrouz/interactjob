'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const MBTI_TYPES = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
const SECTORS = ['Informatique', 'Finance', 'Logistique', 'Commerce', 'Industrie', 'Hôtellerie', 'Santé', 'BTP'];
import { CityOptions } from '@/components/MoroccoSelectOptions';
const LEVELS = ['Junior', 'Confirmé', 'Senior'];

export default function TalentPool() {
  const [data, setData] = useState<{ locked: boolean; count?: number; candidates?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ sector: '', location: '', level: '', mbti: '' });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.sector) params.set('sector', filters.sector);
    if (filters.location) params.set('location', filters.location);
    if (filters.level) params.set('level', filters.level);
    if (filters.mbti) params.set('mbti', filters.mbti);
    const res = await fetch(`/api/employer/talent-pool?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function toggleFavorite(id: string) {
    const res = await fetch('/api/employer/talent-pool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidate_id: id }),
    });
    const json = await res.json();
    if (json.favorited) {
      setFavorites(f => new Set([...f, id]));
    } else {
      setFavorites(f => { const n = new Set(f); n.delete(id); return n; });
    }
  }

  if (loading) return <div className="text-gray-400 text-sm">Chargement...</div>;

  // Locked teaser
  if (data?.locked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#00347A]">Talent Pool</h1>
          <p className="text-gray-500 text-sm mt-1">Base de candidats spontanés disponibles à l&apos;embauche</p>
        </div>

        <div className="relative bg-white rounded-2xl border border-[#D0E4F0] overflow-hidden">
          {/* Blurred preview */}
          <div className="select-none pointer-events-none blur-sm p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between border border-[#D0E4F0] rounded-xl p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                  <div className="flex gap-2">
                    <div className="h-5 bg-[#E0F9FA] rounded-full w-16" />
                    <div className="h-5 bg-gray-100 rounded-full w-20" />
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded-lg w-20" />
              </div>
            ))}
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="text-center px-6 py-8 max-w-sm">
              <div className="text-6xl mb-4">🔒</div>
              <h2 className="text-xl font-bold text-[#00347A] mb-2">
                {data.count} candidats disponibles
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Le Talent Pool est réservé aux abonnés <strong>Pro Mensuel</strong> et <strong>Business Annuel</strong>.
                Accédez aux profils complets, filtrez par secteur, ville, expérience et personnalité.
              </p>
              <Link href="/employeur/tarifs"
                className="inline-block bg-[#00C2CB] hover:bg-[#00a8b5] text-white font-bold px-6 py-3 rounded-xl transition">
                Débloquer avec Pro — 990 MAD/mois →
              </Link>
              <p className="text-xs text-gray-400 mt-3">Annulez à tout moment</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const candidates = data?.candidates || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00347A]">Talent Pool</h1>
        <p className="text-gray-500 text-sm mt-1">{candidates.length} profil{candidates.length !== 1 ? 's' : ''} disponible{candidates.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#D0E4F0] p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={filters.sector} onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
            className="border border-[#D0E4F0] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
            <option value="">Tous les secteurs</option>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
            className="border border-[#D0E4F0] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
            <option value="">Toutes les villes</option>
            <CityOptions />
          </select>
          <select value={filters.level} onChange={e => setFilters(f => ({ ...f, level: e.target.value }))}
            className="border border-[#D0E4F0] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
            <option value="">Tous les niveaux</option>
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
          <select value={filters.mbti} onChange={e => setFilters(f => ({ ...f, mbti: e.target.value }))}
            className="border border-[#D0E4F0] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00C2CB]">
            <option value="">Type MBTI</option>
            {MBTI_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        {Object.values(filters).some(Boolean) && (
          <button onClick={() => setFilters({ sector: '', location: '', level: '', mbti: '' })}
            className="mt-2 text-xs text-gray-400 hover:text-[#00347A]">
            ✕ Effacer les filtres
          </button>
        )}
      </div>

      {candidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D0E4F0] p-12 text-center">
          <p className="text-gray-400">Aucun candidat correspondant aux filtres.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c: any) => {
            const isFav = favorites.has(c._id) || c.favorited_by?.includes('current');
            return (
              <div key={c._id} className="bg-white rounded-2xl border border-[#D0E4F0] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-gray-900">{c.name}</h2>
                      {c.personality_profile?.mbti && (
                        <span className="text-xs bg-[#E0F9FA] text-[#007A80] font-bold px-2 py-0.5 rounded-full">
                          ✓ {c.personality_profile.mbti}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1.5">
                      {c.sector && <span>🏭 {c.sector}</span>}
                      {c.location && <span>📍 {c.location}</span>}
                      {c.experience_level && <span>🎯 {c.experience_level}</span>}
                    </div>
                    {c.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.skills.map((s: string) => (
                          <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleFavorite(c._id)}
                      className={`text-lg transition ${isFav ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}
                      title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
                      ★
                    </button>
                    <a href={`mailto:${c.email}`}
                      className="text-xs bg-[#00347A] hover:bg-[#00285e] text-white px-3 py-1.5 rounded-lg transition">
                      Contacter
                    </a>
                    {c.cv_url && (
                      <a href={c.cv_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs border border-[#D0E4F0] hover:border-[#00C2CB] text-gray-600 px-3 py-1.5 rounded-lg transition">
                        CV ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
