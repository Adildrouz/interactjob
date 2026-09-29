import { NextRequest, NextResponse } from 'next/server';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';
import { sendWelcomeEmail } from '@/lib/employer/email';
import { signEmployerToken, buildSessionCookie } from '@/lib/employer/auth';
import { recordEmployerFunnelEvent } from '@/lib/employer/funnelEvent';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/employeur/connexion?error=token_missing', req.url));
  }

  try {
    await connectEmployerDB();
    const employer = await Employer.findOne({ email_verify_token: token });
    if (!employer) {
      return NextResponse.redirect(new URL('/employeur/connexion?error=token_invalid', req.url));
    }

    employer.email_verified = true;
    employer.email_verify_token = undefined;
    await employer.save();

    recordEmployerFunnelEvent('verified', employer._id.toString()).catch(() => {});

    // Verification already succeeded above — a welcome-email failure (SMTP
    // down, etc.) must never bounce the employer to an error page.
    try {
      await sendWelcomeEmail(employer.email, employer.company_name);
    } catch (err) {
      console.error('[verify-email] welcome email failed', err);
    }

    // Auto-login after verification
    const jwt = await signEmployerToken({
      id: employer._id.toString(),
      email: employer.email,
      company_name: employer.company_name,
      slug: employer.slug,
      plan: employer.plan,
      role: 'employer',
    });

    const res = NextResponse.redirect(new URL('/employeur?welcome=1', req.url));
    res.cookies.set(buildSessionCookie(jwt));
    return res;
  } catch (err) {
    console.error('[verify-email]', err);
    return NextResponse.redirect(new URL('/employeur/connexion?error=server', req.url));
  }
}
