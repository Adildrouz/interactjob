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
  const filePath = path.join(process.cwd(), "data", "jobs.json");
  let jobs: Record<string, unknown>[] = [];
  try {
    jobs = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    jobs = [];
  }

  const active = jobs
    .filter((j) => !j.expired)
    .sort((a, b) => {
      const da = new Date((a.date_scraped as string) || "").getTime();
      const db = new Date((b.date_scraped as string) || "").getTime();
      return db - da;
    })
    .slice(0, 50);

  const items = active
    .map((job) => {
      const slug = (job.slug as string) || (job.id as string);
      const link = `${BASE_URL}/offres/${slug}`;
      const title = escapeXml((job.title as string) || "");
      const company = escapeXml((job.company as string) || "");
      const city = escapeXml((job.city as string) || "");
      const sector = escapeXml((job.sector as string) || "");
      const contractType = escapeXml((job.contractType as string) || "");
      const description = escapeXml(
        (job.hr_commentary as string) || `${title} chez ${company} à ${city}`
      );
      const sourceUrl = (job.source_url as string) || (job.sourceUrl as string) || link;
      const pubDate = toRfc822((job.date_scraped as string) || (job.postedAt as string) || "");

      return `    <item>
      <title>${title} — ${company} (${city})</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${sector}</category>
      <category>${contractType}</category>
      <source url="${escapeXml(sourceUrl)}">${escapeXml((job.source as string) || (job.source_site as string) || "")}</source>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Offres d'emploi — InteractJob.ma</title>
    <link>${BASE_URL}/offres</link>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Les dernières offres d'emploi au Maroc : CDI, CDD, Stage à Casablanca, Rabat, Marrakech et partout au Maroc.</description>
    <language>fr-MA</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>60</ttl>
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
