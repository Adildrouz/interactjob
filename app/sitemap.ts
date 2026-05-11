import { MetadataRoute } from "next";
import jobs from "@/data/jobs.json";
import articles from "@/data/articles.json";
import { routing } from "@/i18n/routing";

const BASE_URL = "https://www.interactjob.ma";
const locales  = routing.locales;

function localizedUrl(path: string, locale: string) {
  return locale === routing.defaultLocale
    ? `${BASE_URL}${path}`
    : `${BASE_URL}/${locale}${path}`;
}

function hreflang(path: string) {
  return Object.fromEntries(locales.map((l) => [l, localizedUrl(path, l)]));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const activeJobs = (jobs as any[]).filter((j) => !j.expired);

  // ── Pages statiques (toutes les locales) ────────────────────────────────
  const staticRoutes = [
    { path: "/",          freq: "daily"   as const, priority: 1.0 },
    { path: "/offres",    freq: "daily"   as const, priority: 0.9 },
    { path: "/blog",      freq: "weekly"  as const, priority: 0.8 },
    { path: "/publier",   freq: "monthly" as const, priority: 0.7 },
    { path: "/a-propos",  freq: "monthly" as const, priority: 0.5 },
  ];

  const staticPages: MetadataRoute.Sitemap = staticRoutes.flatMap(({ path, freq, priority }) =>
    locales.map((locale) => ({
      url:             localizedUrl(path, locale),
      lastModified:    new Date(),
      changeFrequency: freq,
      priority:        locale === routing.defaultLocale ? priority : +(priority * 0.9).toFixed(1),
      alternates:      { languages: hreflang(path) },
    }))
  );

  // ── Pages offres (uniquement actives) ───────────────────────────────────
  const jobPages: MetadataRoute.Sitemap = activeJobs.flatMap((job) =>
    locales.map((locale) => ({
      url:             localizedUrl(`/offres/${job.id}`, locale),
      lastModified:    new Date(job.date_posted || job.postedAt),
      changeFrequency: "weekly" as const,
      priority:        locale === routing.defaultLocale ? 0.8 : 0.7,
      alternates:      { languages: hreflang(`/offres/${job.id}`) },
    }))
  );

  // ── Pages articles ───────────────────────────────────────────────────────
  const articlePages: MetadataRoute.Sitemap = (articles as any[]).flatMap((article) =>
    locales.map((locale) => ({
      url:             localizedUrl(`/blog/${article.slug}`, locale),
      lastModified:    new Date(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority:        locale === routing.defaultLocale ? 0.6 : 0.5,
      alternates:      { languages: hreflang(`/blog/${article.slug}`) },
    }))
  );

  return [...staticPages, ...jobPages, ...articlePages];
}
