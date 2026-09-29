import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';
import { sendVerificationEmail } from '@/lib/employer/email';

const COOLDOWN_MS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
    }

    await connectEmployerDB();
    const employer = await Employer.findOne({ email: String(email).toLowerCase().trim() });

    // Same generic response whether the account exists, is already verified,
    // or was just emailed — avoids leaking which emails have accounts.
    const genericOk = NextResponse.json({
      success: true,
      message: "Si un compte existe avec cet email et n'est pas encore vérifié, un nouveau lien vient d'être envoyé.",
    });

    if (!employer || employer.email_verified) return genericOk;

    if (employer.email_verify_sent_at && Date.now() - employer.email_verify_sent_at.getTime() < COOLDOWN_MS) {
      return genericOk;
    }

    const email_verify_token = randomBytes(32).toString('hex');
    employer.email_verify_token = email_verify_token;
    employer.email_verify_sent_at = new Date();
    await employer.save();

    await sendVerificationEmail(employer.email, email_verify_token, employer.company_name);

    return genericOk;
  } catch (err) {
    console.error('[employer/resend-verification]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
