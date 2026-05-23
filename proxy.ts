import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  // City SEO pages: /offres-emploi-casablanca → serves /offres-emploi/casablanca internally
  const cityMatch = pathname.match(/^\/offres-emploi-([a-z-]+)$/);
  if (cityMatch) {
    return NextResponse.rewrite(new URL(`/offres-emploi/${cityMatch[1]}`, req.url));
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
