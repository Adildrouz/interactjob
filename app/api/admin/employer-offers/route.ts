import { NextRequest, NextResponse } from 'next/server';
import { connectEmployerDB } from '@/lib/employer/db';
import { JobOffer, JobOfferStatus } from '@/lib/models/JobOffer';
import { Employer } from '@/lib/models/Employer';

function checkAdmin(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const b64 = auth.replace('Basic ', '');
  const decoded = Buffer.from(b64, 'base64').toString();
  const [, pass] = decoded.split(':');
  return pass === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectEmployerDB();

  const status = (req.nextUrl.searchParams.get('status') || 'pending') as JobOfferStatus;
  const offers = await JobOffer.find({ status }).sort({ created_at: -1 }).limit(100).lean() as any[];

  // Attach employer info
  const employerIds = [...new Set(offers.map(o => o.employer_id.toString()))];
  const employers = await Employer.find({ _id: { $in: employerIds } })
    .select('company_name email plan verified slug').lean() as any[];
  const empMap: Record<string, any> = {};
  employers.forEach(e => { empMap[e._id.toString()] = e; });

  const enriched = offers.map(o => ({
    ...o,
    employer: empMap[o.employer_id.toString()] || null,
  }));

  return NextResponse.json({ offers: enriched });
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectEmployerDB();

  const { offer_id, action, reason } = await req.json();
  if (!offer_id || !action) return NextResponse.json({ error: 'offer_id and action required.' }, { status: 400 });

  const offer = await JobOffer.findById(offer_id);
  if (!offer) return NextResponse.json({ error: 'Offer not found.' }, { status: 404 });

  if (action === 'approve') {
    offer.status = 'active';
    await offer.save();

    // Increment approved count; auto-trust after 3
    const employer = await Employer.findByIdAndUpdate(
      offer.employer_id,
      { $inc: { approved_offers_count: 1 } },
      { new: true }
    );
    if (employer && employer.approved_offers_count >= 3 && !employer.trusted) {
      await Employer.findByIdAndUpdate(offer.employer_id, { $set: { trusted: true } });
    }
  } else if (action === 'reject') {
    offer.status = 'rejected';
    offer.rejection_reason = reason || '';
    await offer.save();
  } else {
    return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject".' }, { status: 400 });
  }

  return NextResponse.json({ success: true, new_status: offer.status });
}
