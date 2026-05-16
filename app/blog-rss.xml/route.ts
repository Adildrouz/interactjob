import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BASE_URL = "https://www.interactjob.ma";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(dateStr: string): string {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "articles.json");
  let articles: Record<string, unknown>[] = [];
  try {
    articles = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    articles = [];
  }

  const published = articles
    .filter((a) => !a.lang || a.lang === "fr")
    .sort((a, b) => {
      const da = new Date((a.publishedAt as string) || (a.date as string) || "").getTime();
      const db = new Date((b.publishedAt as string) || (b.date as string) || "").getTime();
      return db - da;
    })
    .slice(0, 20);

  const items = published
    .map((article) => {
      const slug = article.slug as string;
      const link = `${BASE_URL}/blog/${slug}`;
      const title = escapeXml((article.title as string) || "");
      const excerpt = escapeXml((article.excerpt as string) || "");
      const category = escapeXml((article.category as string) || "Conseils Carrière");
      const pubDate = toRfc822(
        (article.publishedAt as string) || (article.date as string) || ""
      );

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${excerpt}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${category}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog Emploi — InteractJob.ma</title>
    <link>${BASE_URL}/blog</link>
    <atom:link href="${BASE_URL}/blog-rss.xml" rel="self" type="application/rss+xml" />
    <description>Conseils carrière, astuces recrutement et actualités du marché de l'emploi au Maroc.</description>
    <language>fr-MA</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>3600</ttl>
    <image>
      <url>${BASE_URL}/InteractJob-Logo.png</url>
      <title>InteractJob.ma</title>
      <link>${BASE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
