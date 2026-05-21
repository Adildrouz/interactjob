import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/personality/auth';
import { connectDB } from '@/lib/personality/db';
import PersonalityAssessmentModel from '@/models/PersonalityAssessment';
import PersonalityUserModel from '@/models/PersonalityUser';

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ success: false, error: 'Interdit' }, { status: 403 });
  await connectDB();
  const [total, premium, users, recent] = await Promise.all([
    PersonalityAssessmentModel.countDocuments(),
    PersonalityAssessmentModel.countDocuments({ isPremium: true }),
    PersonalityUserModel.countDocuments(),
    PersonalityAssessmentModel.find().sort({ createdAt: -1 }).limit(10)
      .select('result.label result.dominantType isPremium createdAt').lean(),
  ]);
  const typeBreakdown = await PersonalityAssessmentModel.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$result.dominantType', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return NextResponse.json({
    success: true,
    data: {
      totalAssessments: total, premiumAssessments: premium, totalUsers: users,
      conversionRate: total > 0 ? Math.round((premium / total) * 100) + '%' : '0%',
      revenue: `$${(premium * 4.99).toFixed(2)}`,
      typeBreakdown, recentAssessments: recent,
    },
  });
}
