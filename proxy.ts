import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Files that must be served without redirect (AdSense/IAB crawlers don't follow redirects)
const BYPASS_REDIRECT = /\.(txt|xml|ico|png|jpg|jpeg|svg|gif|webp|json|js|css|woff2?|map)$/i

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') || '';

  // Non-www → www redirect, skipping static files so ads.txt is reachable directly
  if (host === 'interactjob.ma' && !BYPASS_REDIRECT.test(pathname)) {
    const url = req.nextUrl.clone();
    url.host = 'www.interactjob.ma';
    return NextResponse.redirect(url, { status: 301 });
  }

  // Admin pages — custom auth protection, skip next-intl
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    const session = req.cookies.get("admin_session");
    if (!session || session.value !== "authenticated") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // API routes — skip next-intl locale routing
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Personality SaaS — standalone, no locale routing needed
  if (pathname.startsWith("/personality")) {
    return NextResponse.next();
  }

  // Employer space — standalone auth, no locale routing
  if (pathname.startsWith("/employeur")) {
    return NextResponse.next();
  }

  // City SEO pages: /offres-emploi-casablanca → serves /offres-emploi/casablanca internally
  const cityMatch = pathname.match(/^\/offres-emploi-([a-z-]+)$/);
  if (cityMatch) {
    return NextResponse.rewrite(new URL(`/offres-emploi/${cityMatch[1]}`, req.url));
  }

  // Internal design-direction preview — no locale routing, never indexed
  if (pathname.startsWith("/design-preview")) {
    return NextResponse.next();
  }

  // Wadifa page — bypass locale routing
  if (pathname === "/wadifa") {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!_next|_vercel|InteractJob-Logo\\.png|favicon\\.ico|.*\\..*).*)"],
};
