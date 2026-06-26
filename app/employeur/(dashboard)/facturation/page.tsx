'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const PLAN_LABELS: Record<string, string> = {
  standard: 'Standard', pack_sponsoring: 'Pack Sponsoring', pro: 'Pro Mensuel', business: 'Business Annuel',
};
const PLAN_COLORS: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-600', pack_sponsoring: 'bg-amber-100 text-amber-700',
  pro: 'bg-[#E0F9FA] text-[#007A80]', business: 'bg-[#00347A] text-white',
};

export default function Facturation() {
  const [employer, setEmployer] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/employer/auth/session').then(r => r.json()),
      fetch('/api/employer/transactions').then(r => r.json()),
    ]).then(([sess, txns]) => {
      setEmployer(sess.employer);
      setTransactions(txns.transactions || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">Chargement...</div>;

  const plan = employer?.plan || 'standard';
  const planExpiry = employer?.plan_expires_at;
  const credits = employer?.sponsoring_credits || 0;
  const creditsExpiry = employer?.credits_expire_at;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#00347A]">Facturation</h1>
        <p className="text-gray-500 text-sm mt-1">Votre plan actuel et l&apos;historique de vos paiements.</p>
      </div>

      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-[#D0E4F0] p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Plan actuel</h2>
        <div className="flex items-center justify-between">
          <div>
            <span className={`inline-block text-sm font-bold px-3 py-1.5 rounded-full ${PLAN_COLORS[plan]}`}>
              {PLAN_LABELS[plan]}
            </span>
            {planExpiry && (
              <p className="text-xs text-gray-500 mt-2">
                Expire le : {new Date(planExpiry).toLocaleDateString('fr-FR')}
              </p>
            )}
            {credits > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                ⭐ {credits} crédit{credits > 1 ? 's' : ''} de sponsoring
                {creditsExpiry && ` (jusqu'au ${new Date(creditsExpiry).toLocaleDateString('fr-FR')})`}
              </p>
            )}
          </div>
          {plan !== 'business' && (
            <Link href="/employeur/tarifs"
              className="text-sm border border-[#00C2CB] text-[#00347A] hover:bg-[#E0F9FA] px-4 py-2 rounded-xl transition font-medium">
              Changer de plan
            </Link>
          )}
        </div>
      </div>

      {/* Pending bank transfers notice */}
      {transactions.some(t => t.method === 'bank_transfer' && t.status === 'pending') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ⏳ Un virement bancaire est en attente de vérification. Votre plan sera activé sous 24–48h.
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl border border-[#D0E4F0] p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Historique des paiements</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Aucun paiement enregistré.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t: any) => (
              <div key={t._id} className="flex items-center justify-between text-sm border-b border-[#F0F8FF] pb-3 last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{PLAN_LABELS[t.plan] || t.plan}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(t.created_at).toLocaleDateString('fr-FR')} · {t.method === 'paypal' ? 'PayPal' : 'Virement bancaire'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#00347A]">{t.amount} {t.currency}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.status === 'completed' ? 'bg-green-100 text-green-700' :
                    t.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {t.status === 'completed' ? 'Confirmé' : t.status === 'pending' ? 'En attente' : 'Échoué'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
