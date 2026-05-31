import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CvCheckUsage } from '@/lib/models/CvCheckUsage';

export async function POST(req: NextRequest) {
  try {
    const { score, maxScore, wordCount, locale } = await req.json();

    if (typeof score !== 'number' || typeof maxScore !== 'number' || maxScore === 0) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await connectDB();
    await CvCheckUsage.create({
      score,
      maxScore,
      pct:       Math.round((score / maxScore) * 100),
      wordCount: wordCount ?? 0,
      locale:    locale ?? 'fr',
      checkedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Silent fail — never break the CV checker UX for a tracking error
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
