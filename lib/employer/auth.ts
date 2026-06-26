import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'employer_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.EMPLOYER_JWT_SECRET;
  if (!secret) throw new Error('EMPLOYER_JWT_SECRET not set');
  return new TextEncoder().encode(secret);
}

export interface EmployerSession {
  id: string;
  email: string;
  company_name: string;
  slug: string;
  plan: string;
  role: 'employer';
}

export async function signEmployerToken(payload: EmployerSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyEmployerToken(token: string): Promise<EmployerSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as EmployerSession;
  } catch {
    return null;
  }
}

export async function getEmployerSession(): Promise<EmployerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyEmployerToken(token);
}

export async function getEmployerSessionFromRequest(req: NextRequest): Promise<EmployerSession | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyEmployerToken(token);
}

export function buildSessionCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
}

export function clearSessionCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
}
