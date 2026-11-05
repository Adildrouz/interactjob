import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Employer } from '@/lib/models/Employer';
import { ToolEvent } from '@/lib/models/ToolEvent';

export async function GET(req: NextRequest) {
  if (req.cookies.get('admin_session')?.value !== 'authenticated') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    await connectDB();
    const since = new Date(Date.now() - 7 * 86400000);
    const registered = { password_hash: { $type: 'string' as const }, is_seed: { $ne: true } };
    const [unverified, funnel] = await Promise.all([
      Employer.countDocuments({ ...registered, email_verified: { $ne: true } }),
      ToolEvent.aggregate([
        { $match: { tool: 'recruiter_publication', created_at: { $gte: since } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
      ]),
    ]);
    return NextResponse.json({ unverified, days: 7, events: Object.fromEntries(funnel.map(r => [r._id, r.count])) },
      { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Le suivi recruteur est indisponible.' }, { status: 503 });
  }
}
