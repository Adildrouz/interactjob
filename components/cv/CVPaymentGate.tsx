'use client';

import { useState, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { trackToolEvent } from '@/lib/trackToolEvent';

interface CVPaymentGateProps {
  jobTitle: string;
  onPaymentSuccess: () => void;
  onBack: () => void;
}

export default function CVPaymentGate({ jobTitle, onPaymentSuccess, onBack }: CVPaymentGateProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackToolEvent('cv_builder', 'checkout_started', { metadata: { price: 5, currency: 'EUR' } });
  }, []);

  async function createOrder() {
    trackToolEvent('cv_builder', 'payment_attempted', { metadata: { price: 5, currency: 'EUR', method: 'paypal' } });
    const res = await fetch('/api/cv/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json() as { success: boolean; data?: { orderId: string }; error?: string };
    if (!data.success || !data.data) {
      trackToolEvent('cv_builder', 'payment_failed', { metadata: { error_reason: data.error ?? 'create_order_failed' } });
      throw new Error(data.error ?? 'Erreur commande');
    }
    return data.data.orderId;
  }

  async function onApprove(data: { orderID: string }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cv/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      const result = await res.json() as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error ?? 'Vérification échouée');
      trackToolEvent('cv_builder', 'payment_completed', { metadata: { price: 5, currency: 'EUR', method: 'paypal' } });
      onPaymentSuccess();
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Erreur paiement';
      setError(reason);
      trackToolEvent('cv_builder', 'payment_failed', { metadata: { error_reason: reason } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <span className="text-3xl">📄</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vos documents sont prêts !</h2>
        <p className="text-gray-500 text-sm">
          Débloquez la génération pour <strong className="text-gray-800">{jobTitle}</strong>
        </p>
      </div>

      {/* What's included */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-6">
        <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-4">Inclus dans votre pack</p>
        <ul className="space-y-3">
          {[
            { icon: '📄', label: 'CV professionnel', desc: '25 modèles au choix, optimisé ATS' },
            { icon: '✉️', label: 'Lettre de motivation', desc: 'Personnalisée pour le poste' },
            { icon: '📧', label: 'Email de candidature', desc: 'Prêt à envoyer' },
            { icon: '⬇️', label: 'Téléchargement PDF & Word', desc: 'Formats prêts à envoyer' },
          ].map((item) => (
            <li key={item.label} className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{item.icon}</span>
              <div>
                <span className="font-semibold text-gray-800 text-sm">{item.label}</span>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <div className="inline-flex items-baseline gap-2">
          <span className="text-5xl font-black text-gray-900">5€</span>
          <span className="text-gray-400 text-sm">paiement unique</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Paiement sécurisé via PayPal · Sans abonnement</p>
      </div>

      {/* PayPal Button */}
      <div className="space-y-3">
        {loading && (
          <p className="text-center text-sm text-blue-600 animate-pulse">
            ✅ Vérification du paiement…
          </p>
        )}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 text-center">
            {error}
          </div>
        )}

        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '',
            currency: 'EUR',
          }}
        >
          <PayPalButtons
            style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'pay' }}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={(e) => {
              setError(String(e));
              trackToolEvent('cv_builder', 'payment_failed', { metadata: { error_reason: String(e) } });
            }}
            disabled={loading}
          />
        </PayPalScriptProvider>
      </div>

      {/* Back link */}
      <div className="text-center mt-6">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Modifier mes informations
        </button>
      </div>
    </div>
  );
}
