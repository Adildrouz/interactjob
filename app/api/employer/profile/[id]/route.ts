import { NextRequest, NextResponse } from 'next/server';
import { getEmployerSessionFromRequest } from '@/lib/employer/auth';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getEmployerSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  const { id } = await params;
  if (id !== session.id) return NextResponse.json({ error: 'Interdit.' }, { status: 403 });

  try {
    await connectEmployerDB();
    const employer = await Employer.findById(id).select(
      'company_name description sector website location size logo_url verified plan sponsoring_credits slug'
    );
    if (!employer) return NextResponse.json({ error: 'Employeur introuvable.' }, { status: 404 });
    return NextResponse.json({ employer });
  } catch (err) {
    console.error('[employer/profile/get]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
