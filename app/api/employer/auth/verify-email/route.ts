import { after, NextRequest, NextResponse } from 'next/server';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';
import { sendWelcomeEmail } from '@/lib/employer/email';
import { signEmployerToken, buildSessionCookie } from '@/lib/employer/auth';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/employeur/connexion?error=token_missing', req.url));
  }

  try {
    await connectEmployerDB();
    const employer = await Employer.findOneAndUpdate({
      email_verify_token: token,
      email_verified: false,
      // Older emails did not have an expiry field: keep those links usable.
      $or: [{ email_verify_expires_at: { $exists: false } }, { email_verify_expires_at: { $gt: new Date() } }],
    }, {
      $set: { email_verified: true },
      $unset: { email_verify_token: '', email_verify_expires_at: '' },
    }, { new: true });
    if (!employer) {
      return NextResponse.redirect(new URL('/employeur/connexion?error=token_invalid', req.url));
    }

    after(async () => {
      await sendWelcomeEmail(employer.email, employer.company_name)
        .catch(() => console.error('[verify-email] welcome email failed'));
    });

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
