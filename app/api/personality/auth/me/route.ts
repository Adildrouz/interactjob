import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/personality/auth';
import { connectDB } from '@/lib/personality/db';
import PersonalityUserModel from '@/models/PersonalityUser';

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  await connectDB();
  const user = await PersonalityUserModel.findById(session.userId).lean();
  if (!user) return NextResponse.json({ success: false, error: 'Utilisateur introuvable' }, { status: 404 });
  return NextResponse.json({ success: true, data: { id: user._id, email: user.email, name: user.name, role: user.role } });
}
