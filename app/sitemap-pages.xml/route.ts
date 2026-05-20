import { NextResponse } from "next/server";

const BASE_URL = "https://www.interactjob.ma";

export const revalidate = 86400;

const staticRoutes = [
  { path: "/",                          freq: "daily",   priority: "1.0" },
  { path: "/offres",                    freq: "daily",   priority: "0.9" },
  { path: "/offres/remote",             freq: "hourly",  priority: "0.9" },
  { path: "/concours",                  freq: "daily",   priority: "0.9" },
  { path: "/blog",                      freq: "weekly",  priority: "0.8" },
  { path: "/code-travail",              freq: "monthly", priority: "0.8" },
  { path: "/cv-checker",                freq: "monthly", priority: "0.8" },
  { path: "/generateur-cv",             freq: "monthly", priority: "0.7" },
  { path: "/publier",                   freq: "monthly", priority: "0.7" },
  { path: "/a-propos",                  freq: "monthly", priority: "0.5" },
  { path: "/contact",                   freq: "monthly", priority: "0.4" },
  { path: "/mentions-legales",          freq: "yearly",  priority: "0.3" },
  { path: "/politique-confidentialite", freq: "yearly",  priority: "0.3" },
];

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const urls = staticRoutes
    .map(({ path, freq, priority }) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}${path}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en${path}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${BASE_URL}/ar${path}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${path}"/>
  </url>`)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
