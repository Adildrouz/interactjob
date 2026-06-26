import { NextRequest, NextResponse } from 'next/server';
import { getEmployerSessionFromRequest } from '@/lib/employer/auth';
import { connectEmployerDB } from '@/lib/employer/db';
import { EmployerApplication } from '@/lib/models/EmployerApplication';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployerSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();
  const allowed = ['nouveau', 'vu', 'preselectionne', 'refuse'];
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });

  await connectEmployerDB();
  const app = await EmployerApplication.findOne({ _id: id, employer_id: session.id });
  if (!app) return NextResponse.json({ error: 'Candidature introuvable.' }, { status: 404 });

  app.status = status;
  await app.save();
  return NextResponse.json({ success: true });
}
