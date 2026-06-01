import { NextResponse } from "next/server";
import jobs from "@/data/jobs.json";

const BASE_URL = "https://www.interactjob.ma";

export const revalidate = 3600;

export async function GET() {
  const activeJobs = (jobs as any[]).filter((j) => !j.expired);

  const urls = activeJobs
    .map((job) => {
      const lastmod = new Date(job.date_posted || job.postedAt || new Date()).toISOString().split("T")[0];
      return `
  <url>
    <loc>${BASE_URL}/offres/${job.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
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
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
