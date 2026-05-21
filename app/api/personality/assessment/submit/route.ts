import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/personality/db';
import { getSessionFromRequest } from '@/lib/personality/auth';
import { scoreAssessment } from '@/lib/personality/scoring';
import PersonalityAssessmentModel from '@/models/PersonalityAssessment';
import PersonalityUserModel from '@/models/PersonalityUser';

const schema = z.object({
  answers: z.array(z.object({ questionId: z.number().int().min(1).max(40), selectedOption: z.enum(['A','B','C','D']) })).min(40).max(40),
  sessionId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const { answers, sessionId } = schema.parse(body);
    const result = scoreAssessment(answers);
    await connectDB();
    const session = await getSessionFromRequest(req);
    const assessment = await PersonalityAssessmentModel.create({ userId: session?.userId, sessionId, answers, result, isPremium: false });
    if (session?.userId) {
      await PersonalityUserModel.findByIdAndUpdate(session.userId, { $push: { assessments: assessment._id } });
    }
    return NextResponse.json({ success: true, data: { assessmentId: assessment._id.toString(), result } });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: err.issues[0]?.message ?? err.message }, { status: 400 });
    console.error('Assessment submit error:', err);
    return NextResponse.json({ success: false, error: 'Erreur soumission' }, { status: 500 });
  }
}

