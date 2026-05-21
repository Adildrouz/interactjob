import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/personality/db';
import { signToken, COOKIE_OPTIONS } from '@/lib/personality/auth';
import PersonalityUserModel from '@/models/PersonalityUser';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(80),
});

export async function POST(req: Request) {
  try {
    const body = await req.json() as unknown;
    const { email, password, name } = schema.parse(body);
    await connectDB();
    const existing = await PersonalityUserModel.findOne({ email });
    if (existing) return NextResponse.json({ success: false, error: 'Email dÃ©jÃ  utilisÃ©' }, { status: 409 });
    const user = await PersonalityUserModel.create({ email, password, name });
    const token = await signToken({ userId: user._id.toString(), email: user.email, role: user.role });
    const res = NextResponse.json({ success: true, data: { id: user._id, email: user.email, name: user.name, role: user.role } });
    res.cookies.set(COOKIE_OPTIONS.name, token, COOKIE_OPTIONS);
    return res;
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ success: false, error: err.issues[0]?.message ?? err.message }, { status: 400 });
    return NextResponse.json({ success: false, error: 'Erreur inscription' }, { status: 500 });
  }
}

