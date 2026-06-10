import { MetadataRoute } from "next";
import jobs from "@/data/jobs.json";
import articles from "@/data/articles.json";
import codeTravail from "@/data/code-travail.json";
import concours from "@/data/concours.json";
import remoteJobs from "@/data/remote-jobs.json";
import { cities } from "@/lib/cities";

const BASE_URL = "https://www.interactjob.ma";

function url(path: string) {
  return `${BASE_URL}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const activeJobs = (jobs as any[]).filter((j) => !j.expired);

  // ── Static pages ─────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"),                          lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: url("/offres"),                    lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: url("/en/jobs"),                   lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: url("/concours"),                  lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: url("/blog"),                      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: url("/code-travail"),              lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/cv-checker"),                lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/generateur-cv"),             lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: url("/wadifa"),                    lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: url("/stages"),                    lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: url("/blog/jours-feries-maroc-2027"), lastModified: new Date(), changeFrequency: "yearly", priority: 0.8 },
    { url: url("/publier"),                   lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: url("/postuler"),                  lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/a-propos"),                  lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: url("/contact"),                   lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: url("/mentions-legales"),          lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: url("/politique-confidentialite"), lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  // ── City SEO pages — public URL uses hyphen: /offres-emploi-casablanca ───
  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url:             url(`/offres-emploi-${city.slug}`),
    lastModified:    new Date(),
    changeFrequency: "weekly" as const,
    priority:        0.8,
  }));

  // ── Job pages ─────────────────────────────────────────────────────────────
  const jobPages: MetadataRoute.Sitemap = activeJobs.map((job) => ({
    url:             url(`/offres/${job.slug}`),
    lastModified:    new Date((job as any).date_posted || job.postedAt || new Date()),
    changeFrequency: "weekly" as const,
    priority:        0.8,
  }));

  // ── Blog articles ─────────────────────────────────────────────────────────
  const articlePages: MetadataRoute.Sitemap = (articles as any[]).map((article) => ({
    url:             url(`/blog/${article.slug}`),
    lastModified:    new Date(article.publishedAt),
    changeFrequency: "monthly" as const,
    priority:        0.6,
  }));

  // ── Code du travail ───────────────────────────────────────────────────────
  const codeTravailPages: MetadataRoute.Sitemap = (codeTravail as any[]).map((article) => ({
    url:             url(`/code-travail/${article.slug}`),
    lastModified:    new Date("2026-06-10"), // enriched with FAQ + concrètement
    changeFrequency: "monthly" as const,
    priority:        0.8,
  }));

  // ── Concours ──────────────────────────────────────────────────────────────
  const concoursPages: MetadataRoute.Sitemap = (concours as any[]).map((c) => ({
    url:             url(`/concours/${c.slug}`),
    lastModified:    c.datePosted ? new Date(c.datePosted) : new Date(),
    changeFrequency: "weekly" as const,
    priority:        0.8,
  }));

  // ── Remote jobs — last 90 days only ──────────────────────────────────────
  const remoteListPage: MetadataRoute.Sitemap = [{
    url:             url("/offres/remote"),
    lastModified:    new Date(),
    changeFrequency: "hourly" as const,
    priority:        0.9,
  }];

  const cutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const remoteJobPages: MetadataRoute.Sitemap = (remoteJobs as any[])
    .filter((job) => new Date(job.published) >= cutoff90d)
    .map((job) => ({
      url:             url(`/offres/remote/${job.id}`),
      lastModified:    new Date(job.published),
      changeFrequency: "monthly" as const,
      priority:        0.6,
    }));

  return [
    ...staticPages,
    ...cityPages,
    ...jobPages,
    ...articlePages,
    ...codeTravailPages,
    ...concoursPages,
    ...remoteListPage,
    ...remoteJobPages,
  ];
}
