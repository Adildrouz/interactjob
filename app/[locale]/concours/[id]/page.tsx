import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import concoursData from "@/data/concours.json";
import jobsData from "@/data/jobs.json";
import { Concours } from "@/types";
import { inferJobSector, inferConcoursSector, formatDate, isExpired, localizedTitle, localizedOrganization, localizedSummary } from "@/lib/concours";
import { buildFrArAlternates } from "@/lib/hreflang";
import ConcoursAlertForm from "@/components/ConcoursAlertForm";
import TrackedLink from "@/components/TrackedLink";

const allConcours = concoursData as Concours[];
const BASE_URL = "https://www.interactjob.ma";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    allConcours.map((c) => ({ locale, id: c.slug }))
  );
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; id: string }> }
): Promise<Metadata> {
  const { locale, id } = await params;
  const c = UUID_RE.test(id)
    ? allConcours.find((x) => x.id === id)
    : allConcours.find((x) => x.slug === id);
  if (!c) return {};

  const org = localizedOrganization(c, locale);
  const isAr = locale === "ar";
  const title = c.meta_title_ar && isAr ? c.meta_title_ar : `${org} — ${isAr ? "النتائج والمعلومات" : "Résultats & Informations"}`;
  const description = (isAr && c.meta_description_ar) ? c.meta_description_ar : (c.meta_description || localizedSummary(c, locale) || (isAr ? `مباراة توظيف ${org} بالمغرب.` : `Concours de recrutement ${org} au Maroc.`));
  const canonical = `${BASE_URL}/concours/${c.slug}`;

  return {
    title,
    description,
    keywords: [org, isAr ? "مباراة المغرب" : "concours maroc", isAr ? "الوظيفة العمومية" : "fonction publique", c.niveau || ""].filter(Boolean),
    openGraph: { title, description, url: canonical, type: "website", siteName: "InteractJob" },
    alternates: buildFrArAlternates(`/concours/${c.slug}`),
    robots: { index: locale !== "en", follow: true },
  };
}

function resolveDate(datePosted: string | null, deadline: string | null): string {
  if (datePosted) return datePosted;
  if (deadline) {
    const d = new Date(deadline);
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

export default async function ConcoursDetailPage(
  { params }: { params: Promise<{ locale: string; id: string }> }
) {
  const { locale, id } = await params;
  const t = await getTranslations("concours");

  // UUID → slug 301 redirect
  if (UUID_RE.test(id)) {
    const byUUID = allConcours.find((x) => x.id === id);
    if (byUUID?.slug) permanentRedirect(`/concours/${byUUID.slug}`);
    notFound();
  }

  const c = allConcours.find((x) => x.slug === id);
  if (!c) notFound();

  const expired = isExpired(c.deadline);
  const org = localizedOrganization(c, locale);
  const title = localizedTitle(c, locale);
  const summary = localizedSummary(c, locale);
  const isAr = locale === "ar";
  const secondaryTitle = isAr ? c.title_fr : c.title_ar;

  // Related: same secteur first ("Autres concours dans le même secteur"), topped up with same-organization matches
  const concoursSector = inferConcoursSector(c);
  const sameSector = allConcours.filter((x) => x.id !== c.id && !isExpired(x.deadline) && inferConcoursSector(x) === concoursSector);
  const sameOrg = allConcours.filter((x) => x.id !== c.id && x.organization_fr === c.organization_fr);
  const related = [...sameSector, ...sameOrg.filter((x) => !sameSector.some((s) => s.id === x.id))].slice(0, 5);

  const activeJobs = (jobsData as any[]).filter((j) => !j.expired);
  const jobSector = inferJobSector(c);
  const sectorJobs = jobSector ? activeJobs.filter((j) => j.sector === jobSector) : [];
  const similarJobs = (sectorJobs.length >= 2 ? sectorJobs : activeJobs).slice(0, 4);

  const descParagraphs = [
    ...(summary ? [summary] : []),
    t("descIntro", { org }),
    ...(c.niveau ? [t("descNiveau", { niveau: c.niveau })] : []),
    ...(c.postes ? [t("descPostes", { count: c.postes })] : []),
    t("descPrepare", { org }),
    t("descOutro"),
  ];

  // validThrough: use deadline if set, else 6 months after datePosted (government concours stay open long)
  const posted      = new Date(resolveDate(c.datePosted, c.deadline) ?? new Date());
  const defaultExpiry = new Date(posted.getTime() + 180 * 86400000);
  const validThrough  = c.deadline ?? defaultExpiry.toISOString().split("T")[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title,
    datePosted: resolveDate(c.datePosted, c.deadline),
    validThrough,
    hiringOrganization: { "@type": "Organization", name: org },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Maroc",
        addressRegion: "Maroc",
        addressCountry: "MA",
      },
    },
    applicantLocationRequirements: { "@type": "Country", name: "MA" },
    description: descParagraphs.join(" "),
    employmentType: "FULL_TIME",
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "MAD",
      value: { "@type": "QuantitativeValue", minValue: 3111, unitText: "MONTH" },
    },
    url: `${BASE_URL}/concours/${c.slug}`,
    inLanguage: isAr ? "ar-MA" : "fr-MA",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary">{t("breadcrumbHome")}</Link>
          <span>/</span>
          <Link href="/concours" className="hover:text-primary">{t("breadcrumbConcours")}</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{org}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {expired && (
              <div className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-2 rounded-lg inline-block">
                {t("closedBadge")}
              </div>
            )}

            <p className="text-sm font-bold text-primary">{org}</p>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">
              {title}
            </h1>

            {secondaryTitle && (
              <p className="text-base text-gray-500 leading-relaxed" dir={isAr ? "ltr" : "rtl"}>
                {secondaryTitle}
              </p>
            )}

            {summary && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <p className="text-sm font-semibold text-blue-800 mb-1">{t("summaryLabel")}</p>
                <p className="text-sm text-blue-700 leading-relaxed">{summary}</p>
              </div>
            )}

            {c.content_ar && (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  {t("contentArLabel")}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line" dir="rtl">
                  {c.content_ar}
                </p>
              </div>
            )}

            {/* Description SEO */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-gray-900">{t("aboutTitle")}</h2>
              {descParagraphs.map((p, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">{p}</p>
              ))}
            </div>

            {/* CTA */}
            <div>
              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
              >
                {t("viewAnnouncement")}
              </a>
              <p className="text-xs text-gray-400 mt-3">
                {t("sourceAttribution", { source: "alwadifa-maroc.com" })}
              </p>
            </div>

            {/* Préparez votre candidature */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
              <h2 className="text-lg font-bold mb-2">{t("prepareTitle")}</h2>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                {t("prepareDesc")}
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <TrackedLink
                  href={"/cv-checker" as any}
                  event="concours_cta_click"
                  eventParams={{ cta: "cv_checker", concours: c.slug }}
                  className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
                >
                  {t("ctaCvChecker")}
                </TrackedLink>
                <TrackedLink
                  href={"/generateur-cv" as any}
                  event="concours_cta_click"
                  eventParams={{ cta: "generateur_cv", concours: c.slug }}
                  className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
                >
                  {t("ctaCvGenerator")}
                </TrackedLink>
                <TrackedLink
                  href={"/postuler" as any}
                  event="concours_cta_click"
                  eventParams={{ cta: "postuler", concours: c.slug }}
                  className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
                >
                  {t("ctaSpontaneous")}
                </TrackedLink>
              </div>
            </div>

            {/* Alertes concours */}
            <ConcoursAlertForm sector={concoursSector} />

            {/* Offres similaires */}
            {similarJobs.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  {t("similarJobsTitle")}
                </h2>
                <div className="space-y-3">
                  {similarJobs.map((job: any) => (
                    <Link
                      key={job.id}
                      href={`/offres/${job.slug}` as any}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: job.companyColor || "#1d4ed8" }}
                      >
                        {job.companyInitials || job.company?.slice(0, 2).toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {job.company} · {job.city || job.location} · {job.sector}
                        </p>
                      </div>
                      <span className="text-xs text-primary font-semibold flex-shrink-0">{t("viewJobArrow")}</span>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/offres"
                  className="block text-center text-sm text-primary hover:underline mt-4"
                >
                  {t("viewAllJobsArrow")}
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4">{t("keyInfoTitle")}</h2>
              <dl className="space-y-3 text-sm">
                {!!c.postes && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">{t("postesDt")}</dt>
                    <dd className="font-semibold text-gray-900 mt-0.5">
                      {t("postesCount", { count: c.postes })}
                    </dd>
                  </div>
                )}
                {c.niveau && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">{t("niveauDt")}</dt>
                    <dd className="font-semibold text-gray-900 mt-0.5">{c.niveau}</dd>
                  </div>
                )}
                {c.deadline && (
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider">{t("deadlineDt")}</dt>
                    <dd className={`font-semibold mt-0.5 ${expired ? "text-gray-400 line-through" : "text-orange-600"}`}>
                      {formatDate(c.deadline, locale)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wider">{t("publishedDt")}</dt>
                  <dd className="text-gray-700 mt-0.5">{formatDate(c.datePosted, locale)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wider">{t("organizationDt")}</dt>
                  <dd className="text-gray-700 mt-0.5">{org}</dd>
                </div>
              </dl>

              <a
                href={c.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                {t("applyArrow")}
              </a>
            </div>

            {related.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3">
                  {sameSector.length > 0
                    ? t("relatedSectorTitle", { sector: t(`sectors.${concoursSector}`) })
                    : t("relatedOrgTitle", { org })}
                </h2>
                <div className="space-y-2">
                  {related.map((r) => {
                    const rTitle = localizedTitle(r, locale);
                    return (
                      <TrackedLink
                        key={r.id}
                        href={`/concours/${r.slug}` as any}
                        event="concours_related_click"
                        eventParams={{ from: c.slug, to: r.slug }}
                        className="block text-xs text-gray-600 hover:text-primary leading-snug py-1 border-b border-gray-50 last:border-0"
                      >
                        {rTitle.slice(0, 80)}{rTitle.length > 80 ? "…" : ""}
                      </TrackedLink>
                    );
                  })}
                </div>
              </div>
            )}

            <Link
              href="/concours"
              className="block text-center text-sm text-primary hover:underline py-2"
            >
              {t("backToAll")}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
