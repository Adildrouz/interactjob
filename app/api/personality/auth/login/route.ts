import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/personality/db';
import { signToken, COOKIE_OPTIONS } from '@/lib/personality/auth';
import PersonalityUserModel from '@/models/PersonalityUser';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const { email, password } = schema.parse(body);
    await connectDB();
    const user = await PersonalityUserModel.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return NextResponse.json({ success: false, error: 'Identifiants invalides' }, { status: 401 });
    const token = await signToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const res = NextResponse.json({ success: true, data: { id: user._id, email: user.email, name: user.name, role: user.role } });
    res.cookies.set(COOKIE_OPTIONS.name, token, COOKIE_OPTIONS);
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ success: false, error: 'Erreur connexion' }, { status: 500 });
  }
}
