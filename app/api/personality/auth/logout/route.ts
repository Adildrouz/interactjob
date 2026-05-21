import { NextResponse } from 'next/server';
import { COOKIE_OPTIONS } from '@/lib/personality/auth';

export async function POST() {
  const res = NextResponse.redirect(new URL('/personality', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.interactjob.ma'));
  res.cookies.set(COOKIE_OPTIONS.name, '', { ...COOKIE_OPTIONS, maxAge: 0 });
  return res;
}

