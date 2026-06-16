// Entry point for Next.js middleware — logic lives in proxy.ts.
// proxy.ts: non-www → www redirect (bypassing .txt/.xml for AdSense/IAB crawlers)
//           + next-intl locale routing + admin/api bypasses.
export { default } from "./proxy";

export const config = {
  // Run on all routes except Next.js internals.
  // BYPASS_REDIRECT in proxy.ts ensures ads.txt and other static assets
  // are served without redirect so AdSense crawlers can reach them.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
