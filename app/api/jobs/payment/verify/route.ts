import { NextResponse } from 'next/server';
import { captureOrder } from '@/lib/personality/paypal';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { orderId?: string };
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    if (!orderId) return NextResponse.json({ success: false, error: 'orderId manquant' }, { status: 400 });

    const capture = await captureOrder(orderId);
    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Paiement non complété' }, { status: 400 });
    }

    return NextResponse.json({ success: true, paymentId: orderId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur vérification paiement';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
