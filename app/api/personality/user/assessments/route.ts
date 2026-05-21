import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/personality/auth';
import { connectDB } from '@/lib/personality/db';
import PersonalityAssessmentModel from '@/models/PersonalityAssessment';

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  const assessments = await PersonalityAssessmentModel.find({ userId: session.userId })
    .sort({ createdAt: -1 }).select('result isPremium createdAt sessionId').lean();
  return NextResponse.json({ success: true, data: assessments });
}
