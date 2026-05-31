import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CvCheckUsage } from '@/lib/models/CvCheckUsage';

export async function GET() {
  try {
    await connectDB();

    const [total, avgData, scoreDistrib, byLocale, byDay] = await Promise.all([
      CvCheckUsage.countDocuments(),

      CvCheckUsage.aggregate([
        { $group: {
          _id: null,
          avgScore: { $avg: '$pct' },
          avgWords: { $avg: '$wordCount' },
        }},
      ]),

      // Score buckets: <40 Faible / 40-60 Moyen / 60-80 Bon / >80 Excellent
      CvCheckUsage.aggregate([
        { $bucket: {
          groupBy: '$pct',
          boundaries: [0, 40, 60, 80, 101],
          default: 'Other',
          output: { count: { $sum: 1 } },
        }},
      ]),

      CvCheckUsage.aggregate([
        { $group: { _id: '$locale', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Last 30 days — daily counts
      CvCheckUsage.aggregate([
        { $match: { checkedAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$checkedAt' } },
          count: { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]),
    ]);

    const avg = avgData[0] ?? {};
    const labels = ['< 40 (Faible)', '40-60 (Moyen)', '60-80 (Bon)', '80+ (Excellent)'];
    const distribution = scoreDistrib.map((b: any, i: number) => ({
      label: labels[i] ?? b._id,
      count: b.count,
    }));

    return NextResponse.json({
      total,
      avgScore:  avg.avgScore ? Math.round(avg.avgScore) : 0,
      avgWords:  avg.avgWords ? Math.round(avg.avgWords) : 0,
      distribution,
      byLocale,
      byDay,
    });
  } catch (err) {
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
