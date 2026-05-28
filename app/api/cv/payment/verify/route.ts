import { NextResponse } from 'next/server';
import { z } from 'zod';
import { captureOrder } from '@/lib/personality/paypal';

const schema = z.object({ orderId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const { orderId } = schema.parse(body);
    const capture = await captureOrder(orderId);
    if (capture.status !== 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Paiement non complété' }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: { orderId, paid: true } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: err.issues[0]?.message ?? err.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Erreur vérification paiement' }, { status: 500 });
  }
}
