import { NextResponse } from "next/server";
import articles from "@/data/articles.json";

const BASE_URL = "https://www.interactjob.ma";
const MIN_INDEXABLE_WORDS = 350;

export const revalidate = 86400;

function wordCount(article: any): number {
  const text = [article.title, article.excerpt, article.content].filter(Boolean).join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

export async function GET() {
  // Only submit articles that will actually be indexed (≥350 words)
  const indexable = (articles as any[]).filter((a) => wordCount(a) >= MIN_INDEXABLE_WORDS);

  const urls = indexable
    .map((article) => {
      const lastmod = new Date(article.publishedAt).toISOString().split("T")[0];
      return `
  <url>
    <loc>${BASE_URL}/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
