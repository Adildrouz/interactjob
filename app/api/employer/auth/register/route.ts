import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';
import { sendVerificationEmail } from '@/lib/employer/email';

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, company_name, phone, sector, location, website } = await req.json();

    if (!email || !password || !company_name) {
      return NextResponse.json({ error: 'Email, mot de passe et nom d\'entreprise requis.' }, { status: 400 });
    }
    if (!phone || phone.trim().length < 8) {
      return NextResponse.json({ error: 'Le numéro de téléphone est obligatoire.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
    }

    await connectEmployerDB();

    const existing = await Employer.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
    }

    // Generate unique slug
    let slug = slugify(company_name);
    const slugExists = await Employer.findOne({ slug });
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

    const password_hash = await bcrypt.hash(password, 12);
    const email_verify_token = randomBytes(32).toString('hex');

    const employer = await Employer.create({
      email: email.toLowerCase().trim(),
      password_hash,
      company_name: company_name.trim(),
      slug,
      phone: phone.trim(),
      sector,
      location,
      website,
      email_verified: false,
      email_verify_token,
      plan: 'standard',
      sponsoring_credits: 0,
      trusted: false,
      approved_offers_count: 0,
      role: 'employer',
      created_at: new Date(),
    });

    // Send verification email (dry-run in dev mode)
    await sendVerificationEmail(employer.email, email_verify_token, company_name);

    return NextResponse.json({
      success: true,
      message: 'Compte créé. Vérifiez votre email pour activer votre compte.',
      employer_id: employer._id.toString(),
    });
  } catch (err) {
    console.error('[employer/register]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
