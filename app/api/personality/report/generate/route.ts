import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/personality/db';
import { generatePremiumReport } from '@/lib/personality/claude';
import PersonalityAssessmentModel from '@/models/PersonalityAssessment';

const schema = z.object({ assessmentId: z.string().min(1) });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get('assessmentId');
  if (!assessmentId) return NextResponse.json({ success: false, error: 'assessmentId requis' }, { status: 400 });
  await connectDB();
  const a = await PersonalityAssessmentModel.findById(assessmentId).lean();
  if (!a) return NextResponse.json({ success: false, error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ success: true, data: { result: a.result, isPremium: a.isPremium, premiumReport: a.premiumReport ?? null } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const { assessmentId } = schema.parse(body);
    await connectDB();
    const assessment = await PersonalityAssessmentModel.findById(assessmentId);
    if (!assessment) return NextResponse.json({ success: false, error: 'Introuvable' }, { status: 404 });
    if (!assessment.isPremium) return NextResponse.json({ success: false, error: 'Paiement requis' }, { status: 403 });
    if (assessment.premiumReport?.generatedAt) return NextResponse.json({ success: true, data: assessment.premiumReport });
    const report = await generatePremiumReport(assessment.result);
    await PersonalityAssessmentModel.findByIdAndUpdate(assessmentId, { premiumReport: report });
    return NextResponse.json({ success: true, data: report });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: err.errors[0].message }, { status: 400 });
    console.error('Report generate error:', err);
    return NextResponse.json({ success: false, error: 'Erreur génération rapport' }, { status: 500 });
  }
}
