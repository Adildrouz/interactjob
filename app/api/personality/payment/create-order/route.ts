import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/personality/db';
import { createOrder } from '@/lib/personality/paypal';
import PersonalityAssessmentModel from '@/models/PersonalityAssessment';

const schema = z.object({ assessmentId: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const { assessmentId } = schema.parse(body);
    await connectDB();
    const assessment = await PersonalityAssessmentModel.findById(assessmentId);
    if (!assessment) return NextResponse.json({ success: false, error: 'Assessment introuvable' }, { status: 404 });
    if (assessment.isPremium) return NextResponse.json({ success: false, error: 'Déjà premium' }, { status: 400 });
    const order = await createOrder(assessmentId);
    return NextResponse.json({ success: true, data: { orderId: order.id } });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ success: false, error: 'Erreur création commande' }, { status: 500 });
  }
}
