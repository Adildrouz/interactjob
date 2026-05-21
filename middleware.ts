import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip intl middleware for personality, admin, and static assets
  if (
    pathname.startsWith('/personality') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/')
  ) {
    return;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|InteractJob-Logo\\.png|.*\\..*).)',
  ],
};
