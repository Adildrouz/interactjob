import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';
import { signEmployerToken, buildSessionCookie } from '@/lib/employer/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
    }

    await connectEmployerDB();

    const employer = await Employer.findOne({ email: email.toLowerCase().trim() });
    if (!employer) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, employer.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
    }

    if (!employer.email_verified) {
      return NextResponse.json({
        error: 'Veuillez vérifier votre email avant de vous connecter.',
        needs_verification: true,
      }, { status: 403 });
    }

    const token = await signEmployerToken({
      id: employer._id.toString(),
      email: employer.email,
      company_name: employer.company_name,
      slug: employer.slug,
      plan: employer.plan,
      role: 'employer',
    });

    const res = NextResponse.json({ success: true });
    const cookie = buildSessionCookie(token);
    res.cookies.set(cookie);
    return res;
  } catch (err) {
    console.error('[employer/login]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
