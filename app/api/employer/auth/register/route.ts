import { after, NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';
import { sendVerificationEmail } from '@/lib/employer/email';
import { sendEmail } from '@/lib/mailer';

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

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || typeof company_name !== 'string' || !company_name.trim()) {
      return NextResponse.json({ error: 'Email, mot de passe et nom d\'entreprise requis.' }, { status: 400 });
    }
    if (typeof phone !== 'string' || phone.trim().length < 8) {
      return NextResponse.json({ error: 'Le numéro de téléphone est obligatoire.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 });
    }

    await connectEmployerDB();

    const existing = await Employer.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: 'Un compte existe déjà avec cet email. Connectez-vous ; si votre email n’est pas encore validé, vous pourrez renvoyer le lien d’activation.', needs_verification: !existing.email_verified }, { status: 409 });
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
      email_verify_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      verification_sent_at: new Date(),
      plan: 'standard',
      sponsoring_credits: 0,
      trusted: false,
      approved_offers_count: 0,
      role: 'employer',
      created_at: new Date(),
    });

    // Send verification email (dry-run in dev mode)
    let verificationSent = false;
    try {
      verificationSent = (await sendVerificationEmail(employer.email, email_verify_token, company_name)).delivered;
    } catch {
      console.error('[employer/register] verification email failed');
    }
    after(async () => {
      await sendEmail({
        to: 'contact@interactjob.ma',
        subject: 'Nouvelle inscription recruteur — InteractJob',
        text: 'Un compte recruteur a été créé et attend son activation. Consultez le suivi : https://www.interactjob.ma/admin/employeurs',
      }).catch(() => console.error('[employer/register] admin notification failed'));
    });

    return NextResponse.json({
      success: true,
      message: verificationSent
        ? 'Compte créé. Vérifiez votre email pour activer votre compte.'
        : 'Compte créé, mais l’email d’activation n’a pas pu être envoyé. Renvoyez-le depuis la page de connexion ou déposez une annonce sans compte.',
      verificationSent,
      employer_id: employer._id.toString(),
    });
  } catch (err) {
    console.error('[employer/register]', err);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
