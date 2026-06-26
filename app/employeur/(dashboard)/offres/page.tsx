'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', pending: 'En attente', draft: 'Brouillon',
  expired: 'Expirée', suspended: 'Suspendue', rejected: 'Rejetée',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700',
  draft: 'bg-gray-100 text-gray-500', expired: 'bg-red-100 text-red-600',
  suspended: 'bg-orange-100 text-orange-700', rejected: 'bg-red-100 text-red-600',
};

export default function MesOffres() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<{ plan: string; sponsoring_credits: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/employer/offers').then(r => r.json()),
      fetch('/api/employer/auth/session').then(r => r.json()),
    ]).then(([offersData, sessionData]) => {
      setOffers(offersData.offers || []);
      if (sessionData.employer) {
        setPlanInfo({ plan: sessionData.employer.plan, sponsoring_credits: sessionData.employer.sponsoring_credits });
      }
    }).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette offre définitivement ?')) return;
    setDeletingId(id);
    await fetch(`/api/employer/offers/${id}`, { method: 'DELETE' });
    setOffers(o => o.filter(x => x._id !== id));
    setDeletingId(null);
  }

  async function handleSuspend(id: string) {
    await fetch(`/api/employer/offers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'suspended' }),
    });
    setOffers(o => o.map(x => x._id === id ? { ...x, status: 'suspended' } : x));
  }

  const activeCount = offers.filter(o => ['active', 'pending'].includes(o.status)).length;
  const isUnlimited = planInfo && (planInfo.plan === 'pro' || planInfo.plan === 'business');

  if (loading) return <div className="text-gray-400 text-sm">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#00347A]">Mes offres</h1>
          {!isUnlimited && (
            <p className="text-sm text-gray-500 mt-1">
              {activeCount}/10 offres actives
              {activeCount >= 10 && (
                <Link href="/employeur/tarifs" className="ml-2 text-[#00C2CB] font-medium hover:underline">
                  Passer à Pro pour des offres illimitées →
                </Link>
              )}
            </p>
          )}
        </div>
        <Link
          href="/employeur/offres/nouvelle"
          className={`bg-[#00347A] hover:bg-[#00285e] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition ${
            !isUnlimited && activeCount >= 10 ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          + Nouvelle offre
        </Link>
      </div>

      {/* Credits banner */}
      {planInfo && planInfo.sponsoring_credits > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
          ⭐ <strong>{planInfo.sponsoring_credits} crédit(s) de sponsoring</strong> disponible(s) — utilisez-les lors de la création d&apos;une offre.
        </div>
      )}

      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D0E4F0] p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Aucune offre publiée</h2>
          <p className="text-gray-500 text-sm mb-6">Publiez votre première offre d&apos;emploi gratuitement.</p>
          <Link href="/employeur/offres/nouvelle"
            className="inline-block bg-[#00347A] text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-[#00285e] transition">
            Créer une offre
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer: any) => (
            <div key={offer._id} className="bg-white rounded-2xl border border-[#D0E4F0] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-gray-900 truncate">{offer.title}</h2>
                    {offer.is_sponsored && <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">⭐ Sponsorisé</span>}
                    {offer.ai_enriched && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">✨ IA</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1.5">
                    <span>📍 {offer.location}</span>
                    <span>📄 {offer.contract_type}</span>
                    <span>👁 {offer.views} vues</span>
                    <span>📅 {new Date(offer.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[offer.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[offer.status] || offer.status}
                  </span>
                  <Link href={`/employeur/offres/${offer._id}`}
                    className="text-xs border border-[#D0E4F0] hover:border-[#00C2CB] px-3 py-1.5 rounded-lg transition text-gray-600">
                    Modifier
                  </Link>
                  {offer.status === 'active' && (
                    <button onClick={() => handleSuspend(offer._id)}
                      className="text-xs border border-orange-200 text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition">
                      Suspendre
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(offer._id)}
                    disabled={deletingId === offer._id}
                    className="text-xs border border-red-200 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition disabled:opacity-50">
                    {deletingId === offer._id ? '...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
