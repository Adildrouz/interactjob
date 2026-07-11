'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useState, useEffect } from 'react';
import { trackToolEvent } from '@/lib/trackToolEvent';

export function PayPalButton({ assessmentId, onSuccess }: { assessmentId: string; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackToolEvent('personality_test', 'checkout_started', { testType: 'professionnel', metadata: { price: 4.99, currency: 'USD' } });
  }, []);

  async function createOrder() {
    trackToolEvent('personality_test', 'payment_attempted', { testType: 'professionnel', metadata: { price: 4.99, currency: 'USD', method: 'paypal' } });
    const res = await fetch('/api/personality/payment/create-order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessmentId }),
    });
    const data = await res.json() as { success: boolean; data?: { orderId: string }; error?: string };
    if (!data.success || !data.data) {
      trackToolEvent('personality_test', 'payment_failed', { testType: 'professionnel', metadata: { error_reason: data.error ?? 'create_order_failed' } });
      throw new Error(data.error ?? 'Erreur commande');
    }
    return data.data.orderId;
  }

  async function onApprove(data: { orderID: string }) {
    setLoading(true);
    try {
      const res = await fetch('/api/personality/payment/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID, assessmentId }),
      });
      const result = await res.json() as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error ?? 'Vérification échouée');
      trackToolEvent('personality_test', 'payment_completed', { testType: 'professionnel', metadata: { price: 4.99, currency: 'USD', method: 'paypal' } });
      onSuccess();
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Erreur paiement';
      setError(reason);
      trackToolEvent('personality_test', 'payment_failed', { testType: 'professionnel', metadata: { error_reason: reason } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {loading && <p className="text-center text-sm text-slate-400">Vérification du paiement...</p>}
      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3">{error}</div>}
      <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!, currency: 'USD' }}>
        <PayPalButtons style={{ layout: 'vertical', shape: 'rect', color: 'gold' }}
          createOrder={createOrder} onApprove={onApprove}
          onError={(e) => {
            setError(String(e));
            trackToolEvent('personality_test', 'payment_failed', { testType: 'professionnel', metadata: { error_reason: String(e) } });
          }} disabled={loading} />
      </PayPalScriptProvider>
    </div>
  );
}
