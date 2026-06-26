import { NextResponse } from 'next/server';
import { getEmployerSession } from '@/lib/employer/auth';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';

export async function GET() {
  const session = await getEmployerSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });

  // Refresh plan data from DB (plan may have changed since token was issued)
  try {
    await connectEmployerDB();
    const employer = await Employer.findById(session.id).select(
      'email company_name slug plan plan_expires_at sponsoring_credits credits_expire_at verified trusted'
    );
    if (!employer) return NextResponse.json({ authenticated: false }, { status: 401 });

    return NextResponse.json({
      authenticated: true,
      employer: {
        id: employer._id.toString(),
        email: employer.email,
        company_name: employer.company_name,
        slug: employer.slug,
        plan: employer.plan,
        plan_expires_at: employer.plan_expires_at,
        sponsoring_credits: employer.sponsoring_credits,
        credits_expire_at: employer.credits_expire_at,
        verified: employer.verified,
        trusted: employer.trusted,
      },
    });
  } catch (err) {
    console.error('[employer/session]', err);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
