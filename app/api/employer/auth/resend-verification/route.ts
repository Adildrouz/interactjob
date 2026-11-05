import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectEmployerDB } from '@/lib/employer/db';
import { Employer } from '@/lib/models/Employer';
import { resendEmployerVerification } from '@/lib/employer/verification';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (typeof body?.email !== 'string' || typeof body?.password !== 'string') {
      return NextResponse.json({ error: 'Renseignez votre email et votre mot de passe.' }, { status: 400 });
    }
    await connectEmployerDB();
    const employer = await Employer.findOne({ email: body.email.toLowerCase().trim() });
    if (!employer?.password_hash || !await bcrypt.compare(body.password, employer.password_hash)) {
      return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
    }
    if (employer.email_verified) return NextResponse.json({ success: true, message: 'Votre compte est déjà activé. Vous pouvez vous connecter.' });
    const result = await resendEmployerVerification(employer._id.toString());
    if (result.cooldown) return NextResponse.json({ error: 'Patientez une minute avant un nouvel envoi.' }, { status: 429 });
    if (!result.sent) return NextResponse.json({ error: 'L’email n’a pas pu être envoyé. Réessayez ou déposez votre annonce sans compte sur /publier.' }, { status: 503 });
    return NextResponse.json({ success: true, message: 'Un nouveau lien d’activation vous a été envoyé. Vérifiez aussi les courriers indésirables.' });
  } catch {
    return NextResponse.json({ error: 'Impossible de renvoyer le lien. Réessayez.' }, { status: 500 });
  }
}
