import { NextRequest, NextResponse } from 'next/server';
import { getEmployerSessionFromRequest } from '@/lib/employer/auth';
import { connectEmployerDB } from '@/lib/employer/db';
import { JobOffer } from '@/lib/models/JobOffer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployerSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { id } = await params;
  await connectEmployerDB();

  const offer = await JobOffer.findOne({ _id: id, employer_id: session.id }).lean();
  if (!offer) return NextResponse.json({ error: 'Offre introuvable.' }, { status: 404 });

  return NextResponse.json({ offer });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployerSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { id } = await params;
  await connectEmployerDB();

  const offer = await JobOffer.findOne({ _id: id, employer_id: session.id });
  if (!offer) return NextResponse.json({ error: 'Offre introuvable.' }, { status: 404 });

  const body = await req.json();
  const allowed = ['title', 'description', 'location', 'contract_type', 'salary', 'level', 'sector',
    'application_method', 'application_email', 'application_url', 'status'];

  // Only allow suspending/drafting/closing — no re-activating without moderation.
  // 'closed' ("poste pourvu") is a deliberate, final employer action distinct
  // from 'suspended' (hides without a fill-badge) — see Mes Offres UI.
  if (body.status && !['suspended', 'draft', 'closed'].includes(body.status)) {
    delete body.status;
  }

  const update: Record<string, any> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  if (update.status === 'closed') {
    update.closed_at = new Date();
  }

  await JobOffer.findByIdAndUpdate(id, { $set: update });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployerSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { id } = await params;
  await connectEmployerDB();

  const offer = await JobOffer.findOne({ _id: id, employer_id: session.id });
  if (!offer) return NextResponse.json({ error: 'Offre introuvable.' }, { status: 404 });

  await JobOffer.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
