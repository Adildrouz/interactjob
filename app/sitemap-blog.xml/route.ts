import { NextResponse } from "next/server";
import articles from "@/data/articles.json";

const BASE_URL = "https://www.interactjob.ma";

export const revalidate = 86400;

export async function GET() {
  const urls = (articles as any[])
    .map((article) => {
      const lastmod = new Date(article.publishedAt).toISOString().split("T")[0];
      return `
  <url>
    <loc>${BASE_URL}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/blog/${article.slug}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/blog/${article.slug}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${BASE_URL}/ar/blog/${article.slug}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/blog/${article.slug}"/>
  </url>`;
    })
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
