'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface OfferStat {
  id: string; title: string; status: string;
  views: number; applications: number; conversion: number; is_sponsored: boolean;
}

export default function Analytics() {
  const [data, setData] = useState<{ offers: OfferStat[]; totals: any; is_pro: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employer/analytics').then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">Chargement...</div>;
  if (!data) return null;

  const { offers, totals, is_pro } = data;
  const maxViews = Math.max(...offers.map(o => o.views), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00347A]">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Performance de vos offres d&apos;emploi
          {!is_pro && (
            <Link href="/employeur/tarifs" className="ml-2 text-[#00C2CB] hover:underline font-medium">
              → Analytics avancés avec Pro
            </Link>
          )}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Vues totales', value: totals.views, icon: '👁' },
          { label: 'Candidatures', value: totals.applications, icon: '📨' },
          { label: 'Offres actives', value: totals.active_offers, icon: '✅' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-[#D0E4F0] p-5 text-center">
            <div className="text-3xl mb-1">{kpi.icon}</div>
            <div className="text-3xl font-bold text-[#00347A]">{kpi.value}</div>
            <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Bar chart per offer */}
      {offers.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#D0E4F0] p-6">
          <h2 className="font-semibold text-[#00347A] mb-5">Vues par offre</h2>
          <div className="space-y-4">
            {offers.map(offer => (
              <div key={offer.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700 truncate flex-1 mr-4">
                    {offer.title}
                    {offer.is_sponsored && <span className="ml-2 text-amber-500 text-xs">⭐</span>}
                  </span>
                  <span className="text-gray-500 shrink-0">{offer.views} vues · {offer.applications} candidatures</span>
                </div>
                {/* Views bar */}
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00347A] to-[#00C2CB] rounded-full transition-all"
                    style={{ width: `${(offer.views / maxViews) * 100}%` }}
                  />
                </div>
                {/* Conversion */}
                {is_pro && (
                  <div className="flex items-center gap-4 mt-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <div className="h-1.5 bg-green-400 rounded-full" style={{ width: `${Math.min(offer.conversion * 2, 60)}px` }} />
                      Taux de conversion : <strong className="text-gray-600">{offer.conversion}%</strong>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#D0E4F0] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F0F8FF] text-[#00347A] text-xs font-semibold">
            <tr>
              <th className="text-left px-5 py-3">Offre</th>
              <th className="text-right px-4 py-3">Vues</th>
              <th className="text-right px-4 py-3">Candidatures</th>
              {is_pro && <th className="text-right px-4 py-3">Taux conv.</th>}
              <th className="text-right px-5 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F8FF]">
            {offers.map(offer => (
              <tr key={offer.id} className="hover:bg-[#F8FBFF] transition">
                <td className="px-5 py-3 font-medium text-gray-800">
                  {offer.title}
                  {offer.is_sponsored && <span className="ml-1 text-amber-500 text-xs">⭐</span>}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{offer.views}</td>
                <td className="px-4 py-3 text-right text-gray-600">{offer.applications}</td>
                {is_pro && <td className="px-4 py-3 text-right text-gray-600">{offer.conversion}%</td>}
                <td className="px-5 py-3 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    offer.status === 'active' ? 'bg-green-100 text-green-700' :
                    offer.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {offer.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {offers.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Aucune offre à afficher.</p>
        )}
      </div>

      {!is_pro && (
        <div className="bg-gradient-to-r from-[#00347A] to-[#005A9E] rounded-2xl p-6 text-white">
          <h3 className="font-bold mb-2">🔒 Analytics avancés — Pro uniquement</h3>
          <p className="text-sm opacity-80 mb-4">
            Débloquez le taux de conversion, les tendances hebdomadaires et les métriques des offres sponsorisées.
          </p>
          <Link href="/employeur/tarifs"
            className="inline-block bg-[#00C2CB] hover:bg-[#00a8b5] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition">
            Passer à Pro →
          </Link>
        </div>
      )}
    </div>
  );
}
