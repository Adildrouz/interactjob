import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Run intl middleware only on paths that are NOT:
  // - /personality/** (standalone SaaS, no locale needed)
  // - /admin/**
  // - /api/**
  // - static files (_next, favicon, images, etc.)
  matcher: [
    '/((?!personality|admin|api|_next/static|_next/image|favicon\\.ico|favicon\\.png|InteractJob-Logo\\.png|.*\\.[^/]*$).*)',
  ],
};
