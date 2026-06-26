'use client';
import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Link from 'next/link';

type Currency = 'MAD' | 'EUR' | 'CHF';
type Plan = 'pack_sponsoring' | 'pro' | 'business';

const PRICES: Record<Plan, Record<Currency, string>> = {
  pack_sponsoring: { MAD: '490 MAD', EUR: '49 €', CHF: '49 CHF' },
  pro:             { MAD: '990 MAD/mois', EUR: '99 €/mois', CHF: '99 CHF/mois' },
  business:        { MAD: '7 900 MAD/an', EUR: '790 €/an', CHF: '790 CHF/an' },
};

// PayPal amounts in USD (sandbox)
const PAYPAL_AMOUNTS: Record<Plan, string> = {
  pack_sponsoring: '49.00',
  pro: '99.00',
  business: '790.00',
};

const PLANS = [
  {
    id: 'standard' as const,
    name: 'Standard',
    badge: null,
    price: { MAD: 'Gratuit', EUR: 'Gratuit', CHF: 'Gratuit' },
    color: 'border-gray-200',
    headerBg: 'bg-gray-50',
    features: [
      '10 offres actives',
      'Candidatures par email',
      'Page entreprise de base',
      'Modération standard',
    ],
    missing: ['Talent Pool', 'Sponsoring', 'Analytics avancés'],
    cta: 'Plan actuel',
    ctaDisabled: true,
  },
  {
    id: 'pack_sponsoring' as Plan,
    name: 'Pack Sponsoring',
    badge: '⭐',
    price: PRICES.pack_sponsoring,
    color: 'border-amber-300',
    headerBg: 'bg-amber-50',
    features: [
      '10 offres actives',
      '5 crédits de sponsoring (60 jours)',
      'Mise en avant homepage + newsletter 8K',
      'Badge gold + position prioritaire',
      'Analytics par offre sponsorisée',
    ],
    missing: ['Talent Pool'],
    cta: 'Acheter',
    ctaDisabled: false,
  },
  {
    id: 'pro' as Plan,
    name: 'Pro Mensuel',
    badge: '🚀',
    price: PRICES.pro,
    color: 'border-[#00C2CB]',
    headerBg: 'bg-[#F0FEFF]',
    highlight: true,
    features: [
      'Offres illimitées',
      'Talent Pool complet',
      '3 crédits de sponsoring/mois inclus',
      'Analytics avancés + tendances',
      'Page entreprise premium',
    ],
    missing: [],
    cta: 'Commencer',
    ctaDisabled: false,
  },
  {
    id: 'business' as Plan,
    name: 'Business Annuel',
    badge: '💎',
    price: PRICES.business,
    color: 'border-[#00347A]',
    headerBg: 'bg-[#00347A]',
    dark: true,
    features: [
      'Tout Pro inclus',
      'Sponsoring illimité',
      'Badge Vérifié ✓',
      'Support prioritaire',
      'Facturation annuelle',
    ],
    missing: [],
    cta: 'Choisir Business',
    ctaDisabled: false,
  },
];

export default function Tarifs() {
  const [currency, setCurrency] = useState<Currency>('MAD');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [payMethod, setPayMethod] = useState<'paypal' | 'bank' | null>(null);
  const [bankProof, setBankProof] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb';

  async function handlePayPalApprove(orderId: string, plan: Plan) {
    try {
      const res = await fetch('/api/employer/payment/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, plan }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`Plan ${plan === 'pack_sponsoring' ? 'Pack Sponsoring' : plan === 'pro' ? 'Pro Mensuel' : 'Business Annuel'} activé ! Rechargez la page pour voir les changements.`);
        setSelectedPlan(null);
      } else {
        setError(data.error || 'Erreur de paiement.');
      }
    } catch {
      setError('Erreur réseau.');
    }
  }

  async function handleBankTransfer() {
    if (!bankProof || !selectedPlan) return;
    setSubmitting(true); setError('');
    try {
      const formData = new FormData();
      formData.append('plan', selectedPlan);
      formData.append('proof', bankProof);
      const res = await fetch('/api/employer/payment/bank-transfer', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setSuccess('Preuve de virement reçue. Votre plan sera activé sous 24–48h après vérification.');
        setSelectedPlan(null);
        setBankProof(null);
      } else {
        setError(data.error || 'Erreur.');
      }
    } catch { setError('Erreur réseau.'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#00347A]">Nos offres</h1>
        <p className="text-gray-500 text-sm mt-1">Choisissez le plan qui correspond à vos besoins de recrutement.</p>
      </div>

      {/* Currency toggle */}
      <div className="flex gap-2">
        {(['MAD', 'EUR', 'CHF'] as Currency[]).map(c => (
          <button key={c} onClick={() => setCurrency(c)}
            className={`text-sm font-medium px-4 py-2 rounded-xl transition ${
              currency === c ? 'bg-[#00347A] text-white' : 'border border-[#D0E4F0] text-gray-600 hover:bg-[#F0F8FF]'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4">{success}</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map(plan => (
          <div key={plan.id}
            className={`rounded-2xl border-2 overflow-hidden flex flex-col ${plan.color} ${plan.highlight ? 'ring-2 ring-[#00C2CB]' : ''}`}>
            <div className={`px-5 py-4 ${plan.headerBg}`}>
              {plan.badge && <div className="text-2xl mb-1">{plan.badge}</div>}
              <h2 className={`font-bold text-lg ${plan.dark ? 'text-white' : 'text-[#00347A]'}`}>{plan.name}</h2>
              <p className={`text-2xl font-bold mt-1 ${plan.dark ? 'text-[#00C2CB]' : 'text-[#00347A]'}`}>
                {'price' in plan && typeof plan.price === 'object' && currency in plan.price
                  ? plan.price[currency]
                  : plan.price[currency as keyof typeof plan.price]}
              </p>
            </div>
            <div className="px-5 py-4 flex-1 bg-white">
              <ul className="space-y-2 text-sm text-gray-700">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
                {plan.missing.map(f => (
                  <li key={f} className="flex items-start gap-2 opacity-40">
                    <span className="mt-0.5 shrink-0">✗</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-5 pb-5 bg-white">
              {plan.ctaDisabled ? (
                <span className="block text-center text-sm text-gray-400 py-2">Plan actuel</span>
              ) : (
                <button
                  onClick={() => { setSelectedPlan(plan.id as Plan); setPayMethod(null); setError(''); }}
                  className={`w-full font-semibold py-2.5 rounded-xl text-sm transition ${
                    plan.highlight
                      ? 'bg-[#00C2CB] hover:bg-[#00a8b5] text-white'
                      : 'bg-[#00347A] hover:bg-[#00285e] text-white'
                  }`}>
                  {plan.cta}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Payment modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#00347A] text-lg">
                Paiement — {PLANS.find(p => p.id === selectedPlan)?.name}
              </h2>
              <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="bg-[#F0F8FF] rounded-xl p-3 text-sm text-gray-600">
              <strong>{PRICES[selectedPlan][currency]}</strong>
              <span className="ml-2 text-xs text-gray-400">(mode Sandbox — aucun vrai paiement)</span>
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 rounded-xl p-3">{error}</div>}

            {/* Method selector */}
            <div className="flex gap-3">
              <button onClick={() => setPayMethod('paypal')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${
                  payMethod === 'paypal' ? 'border-[#003087] bg-[#003087] text-white' : 'border-[#D0E4F0] text-gray-600 hover:bg-gray-50'
                }`}>
                PayPal
              </button>
              <button onClick={() => setPayMethod('bank')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition border ${
                  payMethod === 'bank' ? 'border-[#00347A] bg-[#00347A] text-white' : 'border-[#D0E4F0] text-gray-600 hover:bg-gray-50'
                }`}>
                Virement bancaire
              </button>
            </div>

            {/* PayPal flow */}
            {payMethod === 'paypal' && (
              <PayPalScriptProvider options={{ clientId, currency: 'USD' }}>
                <PayPalButtons
                  style={{ layout: 'vertical', shape: 'rect' }}
                  createOrder={async () => {
                    const res = await fetch('/api/employer/payment/create-order', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ plan: selectedPlan }),
                    });
                    const data = await res.json();
                    if (!data.orderId) throw new Error(data.error || 'Failed to create order');
                    return data.orderId;
                  }}
                  onApprove={async (data) => {
                    await handlePayPalApprove(data.orderID, selectedPlan);
                  }}
                  onError={(err) => setError(String(err))}
                />
              </PayPalScriptProvider>
            )}

            {/* Bank transfer flow */}
            {payMethod === 'bank' && (
              <div className="space-y-4">
                <div className="bg-[#F0F8FF] rounded-xl p-4 text-sm space-y-1 border border-[#D0E4F0]">
                  <p className="font-semibold text-[#00347A]">Coordonnées bancaires</p>
                  <p><strong>Banque :</strong> CIH Bank Maroc</p>
                  <p><strong>Titulaire :</strong> InteractJob</p>
                  <p><strong>RIB :</strong> 230 810 0000000000000 00</p>
                  <p><strong>Montant :</strong> {PRICES[selectedPlan]['MAD']}</p>
                  <p><strong>Référence :</strong> EMPLOYER-{selectedPlan.toUpperCase()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joindre votre preuve de virement (PDF ou image)
                  </label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setBankProof(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#00347A] file:text-white file:text-sm file:font-medium hover:file:bg-[#00285e]"
                  />
                </div>
                <button
                  onClick={handleBankTransfer}
                  disabled={!bankProof || submitting}
                  className="w-full bg-[#00347A] hover:bg-[#00285e] text-white font-semibold py-3 rounded-xl transition disabled:opacity-60">
                  {submitting ? 'Envoi...' : 'Envoyer la preuve de virement'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-[#D0E4F0] p-6 space-y-4">
        <h2 className="font-semibold text-[#00347A]">Questions fréquentes</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-800">Les crédits de sponsoring expirent-ils ?</p>
            <p>Oui, les crédits du Pack Sponsoring expirent après 60 jours. Les crédits Pro se renouvellent chaque mois.</p>
          </div>
          <div>
            <p className="font-medium text-gray-800">Puis-je annuler mon abonnement Pro ?</p>
            <p>Oui, contactez-nous à contact@interactjob.ma. L&apos;annulation prend effet à la fin de la période en cours.</p>
          </div>
          <div>
            <p className="font-medium text-gray-800">Le virement bancaire prend combien de temps ?</p>
            <p>24 à 48h ouvrables après réception de la preuve de paiement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
