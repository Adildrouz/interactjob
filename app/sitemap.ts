import { MetadataRoute } from "next";
import jobs from "@/data/jobs.json";
import articles from "@/data/articles.json";
import codeTravail from "@/data/code-travail.json";
import concours from "@/data/concours.json";
import remoteJobs from "@/data/remote-jobs.json";
import { routing } from "@/i18n/routing";
import { cities } from "@/lib/cities";

const BASE_URL = "https://www.interactjob.ma";
const locales  = routing.locales;

function localizedUrl(path: string, locale: string) {
  return locale === routing.defaultLocale
    ? `${BASE_URL}${path}`
    : `${BASE_URL}/${locale}${path}`;
}

function hreflang(path: string) {
  const langs = Object.fromEntries(locales.map((l) => [l, localizedUrl(path, l)]));
  langs["x-default"] = `${BASE_URL}${path}`; // canonical FR = x-default
  return langs;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const activeJobs = (jobs as any[]).filter((j) => !j.expired);

  // ── Helper: French-only canonical URL (no /ar/ or /en/ variants) ─────────
  function canonicalUrl(path: string) {
    return `${BASE_URL}${path}`;
  }

  // ── Pages statiques — canonical FR uniquement ────────────────────────────
  const staticRoutes = [
    { path: "/",                          freq: "daily"   as const, priority: 1.0 },
    { path: "/offres",                    freq: "daily"   as const, priority: 0.9 },
    { path: "/concours",                  freq: "daily"   as const, priority: 0.9 },
    { path: "/blog",                      freq: "weekly"  as const, priority: 0.8 },
    { path: "/code-travail",              freq: "monthly" as const, priority: 0.8 },
    { path: "/cv-checker",               freq: "monthly" as const, priority: 0.8 },
    { path: "/generateur-cv",            freq: "monthly" as const, priority: 0.7 },
    { path: "/wadifa",                    freq: "daily"   as const, priority: 0.8 },
    { path: "/stages",                    freq: "daily"   as const, priority: 0.8 },
    { path: "/blog/jours-feries-maroc-2027", freq: "yearly" as const, priority: 0.8 },
    { path: "/publier",                   freq: "monthly" as const, priority: 0.7 },
    { path: "/postuler",                  freq: "monthly" as const, priority: 0.6 },
    { path: "/a-propos",                  freq: "monthly" as const, priority: 0.5 },
    { path: "/contact",                   freq: "monthly" as const, priority: 0.4 },
    { path: "/mentions-legales",          freq: "yearly"  as const, priority: 0.3 },
    { path: "/politique-confidentialite", freq: "yearly"  as const, priority: 0.3 },
  ];

  const staticPages: MetadataRoute.Sitemap = staticRoutes.map(({ path, freq, priority }) => ({
    url:             canonicalUrl(path),
    lastModified:    new Date(),
    changeFrequency: freq,
    priority,
    alternates:      { languages: hreflang(path) },
  }));

  // ── Pages offres — slug SEO, canonical FR uniquement (pas d'alternates EN/AR) ──
  const jobPages: MetadataRoute.Sitemap = activeJobs.map((job) => ({
    url:             canonicalUrl(`/offres/${job.slug}`),
    lastModified:    new Date((job as any).date_posted || job.postedAt || new Date()),
    changeFrequency: "weekly" as const,
    priority:        0.8,
  }));

  // ── Pages articles — canonical FR uniquement ─────────────────────────────
  const articlePages: MetadataRoute.Sitemap = (articles as any[]).map((article) => ({
    url:             canonicalUrl(`/blog/${article.slug}`),
    lastModified:    new Date(article.publishedAt),
    changeFrequency: "monthly" as const,
    priority:        0.6,
    alternates:      { languages: hreflang(`/blog/${article.slug}`) },
  }));

  // ── Pages code du travail ────────────────────────────────────────────────
  const codeTravailPages: MetadataRoute.Sitemap = (codeTravail as any[]).map((article) => ({
    url:             canonicalUrl(`/code-travail/${article.slug}`),
    lastModified:    new Date("2024-01-01"),
    changeFrequency: "yearly" as const,
    priority:        0.7,
    alternates:      { languages: hreflang(`/code-travail/${article.slug}`) },
  }));

  // ── Pages concours — slug SEO, canonical FR uniquement ──────────────────
  const concoursPages: MetadataRoute.Sitemap = (concours as any[]).map((c) => ({
    url:             canonicalUrl(`/concours/${c.slug}`),
    lastModified:    c.datePosted ? new Date(c.datePosted) : new Date(),
    changeFrequency: "weekly" as const,
    priority:        0.8,
    alternates:      { languages: hreflang(`/concours/${c.slug}`) },
  }));

  // ── Pages remote jobs — limité aux 90 derniers jours (budget crawl) ────────
  const remoteListPage: MetadataRoute.Sitemap = [{
    url:             canonicalUrl("/offres/remote"),
    lastModified:    new Date(),
    changeFrequency: "hourly" as const,
    priority:        0.9,
  }];

  const cutoff90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const remoteJobPages: MetadataRoute.Sitemap = (remoteJobs as any[])
    .filter((job) => new Date(job.published) >= cutoff90d)
    .map((job) => ({
      url:             canonicalUrl(`/offres/remote/${job.id}`),
      lastModified:    new Date(job.published),
      changeFrequency: "monthly" as const,
      priority:        0.6,
    }));

  // ── Pages villes — /offres-emploi/[city] ─────────────────────────────────
  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url:             canonicalUrl(`/offres-emploi/${city.slug}`),
    lastModified:    new Date(),
    changeFrequency: "weekly" as const,
    priority:        0.8,
    alternates:      { languages: hreflang(`/offres-emploi/${city.slug}`) },
  }));

  return [...staticPages, ...cityPages, ...jobPages, ...articlePages, ...codeTravailPages, ...concoursPages, ...remoteListPage, ...remoteJobPages];
}
