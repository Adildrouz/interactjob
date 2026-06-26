import { NextRequest, NextResponse } from 'next/server';
import { getEmployerSessionFromRequest } from '@/lib/employer/auth';
import { connectEmployerDB } from '@/lib/employer/db';
import { EmployerApplication } from '@/lib/models/EmployerApplication';
import { JobOffer } from '@/lib/models/JobOffer';

export async function GET(req: NextRequest) {
  const session = await getEmployerSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  await connectEmployerDB();
  const offerId = req.nextUrl.searchParams.get('offer');
  const query: any = { employer_id: session.id };
  if (offerId) query.offer_id = offerId;

  const applications = await EmployerApplication.find(query).sort({ created_at: -1 }).lean();

  // Attach offer titles
  const offerIds = [...new Set(applications.map((a: any) => a.offer_id.toString()))];
  const offers = await JobOffer.find({ _id: { $in: offerIds } }).select('title').lean() as any[];
  const offerMap: Record<string, string> = {};
  offers.forEach((o: any) => { offerMap[o._id.toString()] = o.title; });

  const enriched = applications.map((a: any) => ({
    ...a,
    offer_title: offerMap[a.offer_id.toString()] || 'Offre inconnue',
  }));

  return NextResponse.json({ applications: enriched });
}
