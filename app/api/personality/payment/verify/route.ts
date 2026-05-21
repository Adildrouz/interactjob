import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/personality/db';
import { captureOrder } from '@/lib/personality/paypal';
import PersonalityAssessmentModel from '@/models/PersonalityAssessment';

const schema = z.object({ orderId: z.string().min(1), assessmentId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const { orderId, assessmentId } = schema.parse(body);
    const capture = await captureOrder(orderId);
    if (capture.status !== 'COMPLETED') return NextResponse.json({ success: false, error: 'Paiement non complÃ©tÃ©' }, { status: 400 });
    await connectDB();
    const assessment = await PersonalityAssessmentModel.findByIdAndUpdate(assessmentId, { isPremium: true, paymentId: orderId }, { new: true });
    if (!assessment) return NextResponse.json({ success: false, error: 'Assessment introuvable' }, { status: 404 });
    return NextResponse.json({ success: true, data: { assessmentId, isPremium: true } });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: err.issues[0]?.message ?? err.message }, { status: 400 });
    return NextResponse.json({ success: false, error: 'Erreur vÃ©rification paiement' }, { status: 500 });
  }
}

