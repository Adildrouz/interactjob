import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/personality/paypal';

const SPONSORED_PRICE_EUR = '89.00';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { company?: string };
    const company = typeof body.company === 'string' ? body.company.trim() : 'Entreprise';

    const token = await getAccessToken();
    const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'EUR', value: SPONSORED_PRICE_EUR },
          description: `InteractJob — Offre Sponsorisée 45 jours (${company})`,
        }],
      }),
    });

    if (!res.ok) throw new Error(`PayPal create order failed: ${res.status}`);
    const order = await res.json() as { id: string };
    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur création commande';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
