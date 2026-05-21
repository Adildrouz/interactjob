import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/personality/db';
import PersonalityAssessmentModel from '@/models/PersonalityAssessment';
import { sendReportEmail } from '@/lib/personality/email';

const schema = z.object({
  assessmentId: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const { assessmentId, email } = schema.parse(body);

    await connectDB();
    const assessment = await PersonalityAssessmentModel.findById(assessmentId).lean();
    if (!assessment) return NextResponse.json({ success: false, error: 'Résultat introuvable' }, { status: 404 });
    if (!assessment.isPremium || !assessment.premiumReport) {
      return NextResponse.json({ success: false, error: 'Rapport premium non disponible' }, { status: 403 });
    }

    await sendReportEmail(email, assessment.result, assessment.premiumReport);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: err.issues[0]?.message ?? err.message }, { status: 400 });
    console.error('Email send error:', err);
    return NextResponse.json({ success: false, error: 'Échec de l\'envoi' }, { status: 500 });
  }
}
