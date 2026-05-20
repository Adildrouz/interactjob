import { NextResponse } from "next/server";
import remoteJobs from "@/data/remote-jobs.json";

const BASE_URL = "https://www.interactjob.ma";

export const revalidate = 3600;

type RemoteJob = {
  id: string;
  title: string;
  company: string;
  link: string;
  published: string;
  summary: string;
  source: string;
  category: string;
};

export async function GET() {
  const jobs = (remoteJobs as RemoteJob[]).slice(0, 100);

  const items = jobs
    .map((job) => {
      const pubDate = new Date(job.published).toUTCString();
      const url = `${BASE_URL}/offres/remote/${job.id}`;
      const desc = job.summary
        ? job.summary.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        : `Offre remote — ${job.company}`;
      return `
    <item>
      <title><![CDATA[${job.title} — ${job.company}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description><![CDATA[${desc}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${job.category}]]></category>
      <source url="${BASE_URL}/offres/remote">${job.source}</source>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Offres Remote — InteractJob.ma</title>
    <link>${BASE_URL}/offres/remote</link>
    <description>Les meilleures offres de travail à distance mondiales, agrégées toutes les heures par InteractJob.ma</description>
    <language>fr-MA</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/remote-rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/InteractJob-Logo.png</url>
      <title>InteractJob Remote Jobs</title>
      <link>${BASE_URL}/offres/remote</link>
    </image>${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
