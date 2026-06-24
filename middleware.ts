import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;

  // Non-www → www redirect (301 permanent)
  // ads.txt bypasses redirect so Google AdSense can still verify the file on both domains.
  if (
    (host === "interactjob.ma" || host.startsWith("interactjob.ma:")) &&
    pathname !== "/ads.txt"
  ) {
    const url = request.nextUrl.clone();
    url.host = "www.interactjob.ma";
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths. Edge runtime — no Node.js APIs.
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
