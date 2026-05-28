import { NextResponse } from 'next/server';
import { captureOrder } from '@/lib/personality/paypal';

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function POST() {
  try {
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'EUR', value: '5.00' },
          description: 'InteractJob — Générateur CV IA (CV + Lettre + Email)',
        }],
      }),
    });
    if (!res.ok) throw new Error(`PayPal create order failed: ${res.status}`);
    const order = (await res.json()) as { id: string };
    return NextResponse.json({ success: true, data: { orderId: order.id } });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Erreur création commande' }, { status: 500 });
  }
}
