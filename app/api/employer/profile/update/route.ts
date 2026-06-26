import { NextRequest, NextResponse } from 'next/server';
import { getEmployerSessionFromRequest } from '@/lib/employer/auth';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';

export async function PATCH(req: NextRequest) {
  const session = await getEmployerSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });

  try {
    const { company_name, description, sector, website, location, size, logo_url, phone } = await req.json();

    await connectEmployerDB();
    await Employer.findByIdAndUpdate(session.id, {
      $set: { company_name, description, sector, website, location, size, logo_url, phone },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[employer/profile/update]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
