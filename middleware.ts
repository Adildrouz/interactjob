import { NextRequest, NextResponse } from 'next/server'

// Files served directly without redirect — AdSense/IAB crawlers don't follow redirects on ads.txt
const BYPASS_REDIRECT = /\.(txt|xml|ico|png|jpg|jpeg|svg|gif|webp|json|js|css|woff2?|map)$/i

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  // Non-www → www (permanent 301), but never redirect static files
  if (host === 'interactjob.ma' && !BYPASS_REDIRECT.test(pathname)) {
    const url = request.nextUrl.clone()
    url.host = 'www.interactjob.ma'
    return NextResponse.redirect(url, { status: 301 })
  }

  return NextResponse.next()
}

export const config = {
  // Run on all paths except Next.js internals and image optimization
  matcher: ['/((?!_next/static|_next/image).*)'],
}
