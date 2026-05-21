import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/personality/db';
import { generatePremiumReport } from '@/lib/personality/claude';
import PersonalityAssessmentModel from '@/models/PersonalityAssessment';

const postSchema = z.object({
  assessmentId: z.string().min(1),
  candidateName: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get('assessmentId');
  if (!assessmentId) return NextResponse.json({ success: false, error: 'assessmentId requis' }, { status: 400 });
  await connectDB();
  const a = await PersonalityAssessmentModel.findById(assessmentId).lean();
  if (!a) return NextResponse.json({ success: false, error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({
    success: true,
    data: {
      result: a.result,
      isPremium: a.isPremium,
      premiumReport: a.premiumReport ?? null,
      candidateName: a.candidateName ?? null,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const { assessmentId, candidateName } = postSchema.parse(body);
    await connectDB();
    const assessment = await PersonalityAssessmentModel.findById(assessmentId);
    if (!assessment) return NextResponse.json({ success: false, error: 'Introuvable' }, { status: 404 });
    if (!assessment.isPremium) return NextResponse.json({ success: false, error: 'Paiement requis' }, { status: 403 });

    const updateData: Record<string, unknown> = {};
    if (candidateName) updateData.candidateName = candidateName;

    if (assessment.premiumReport?.generatedAt) {
      if (Object.keys(updateData).length) {
        await PersonalityAssessmentModel.findByIdAndUpdate(assessmentId, updateData);
      }
      return NextResponse.json({ success: true, data: { premiumReport: assessment.premiumReport, candidateName: candidateName ?? assessment.candidateName } });
    }

    const report = await generatePremiumReport(assessment.result);
    updateData.premiumReport = report;
    await PersonalityAssessmentModel.findByIdAndUpdate(assessmentId, updateData);
    return NextResponse.json({ success: true, data: { premiumReport: report, candidateName: candidateName ?? assessment.candidateName } });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: err.issues[0]?.message ?? err.message }, { status: 400 });
    console.error('Report generate error:', err);
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Erreur génération rapport' }, { status: 500 });
  }
}
