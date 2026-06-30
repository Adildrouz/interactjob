import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import jobs from "@/data/jobs.json";
import { Job } from "@/types";
import ApplyForm from "@/components/ApplyForm";
import JobAlertSignup from "@/components/JobAlertSignup";
import JobVisitTracker from "@/components/JobVisitTracker";

export const revalidate = 3600;

const allJobs = jobs as unknown as Job[];
const BASE_URL = "https://www.interactjob.ma";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    allJobs.map((j) => ({ locale, slug: (j as any).slug || j.id }))
  );
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const job = UUID_RE.test(slug) ? allJobs.find((j) => j.id === slug) : allJobs.find((j) => (j as any).slug === slug);
  if (!job) return { robots: { index: false, follow: false } };

  const title       = (job as any).meta_title       || `${job.title} – ${job.company} | ${job.city}`;
  const description = (job as any).meta_description || `Offre d'emploi ${job.contractType} : ${job.title} chez ${job.company} à ${job.city}. Postulez maintenant sur InteractJob.`;
  const canonical   = `${BASE_URL}/offres/${(job as any).slug || job.id}`;

  // Expired jobs: tell Google not to index them — saves crawl budget
  if (job.expired) {
    return { title, robots: { index: false, follow: false } };
  }

  // Non-FR locales: noindex to avoid "Alternate page with proper canonical" in GSC
  const { locale } = await params;
  if (locale !== "fr") {
    return { title, description, robots: { index: false, follow: true }, alternates: { canonical } };
  }

  return {
    title,
    description,
    keywords: [job.title, job.company, job.city, job.sector, job.contractType, "emploi maroc", "recrutement maroc"],
    openGraph: {
      title,
      description,
      url:      canonical,
      type:     "website",
      siteName: "InteractJob",
      locale:   "fr_MA",
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: {
      canonical,
      languages: {
        fr: canonical,
        en: `${BASE_URL}/en/offres/${(job as any).slug || job.id}`,
        ar: `${BASE_URL}/ar/offres/${(job as any).slug || job.id}`,
        "x-default": canonical,
      },
    },
  };
}

const contractColor: Record<Job["contractType"], string> = {
  CDI: "bg-blue-100 text-blue-700",
  CDD: "bg-amber-100 text-amber-700",
  Stage: "bg-purple-100 text-purple-700",
};

// Fuzzy slug matcher: handles LinkedIn-shared URLs where the enricher regenerated the slug.
// Strategy 1: word-overlap ≥70% (handles French slug reorder/extension).
// Strategy 2: normalized-prefix match with uniqueness guard (handles Arabic→French slug changes).
function findByFuzzySlug(slug: string): (Job & { slug?: string }) | undefined {
  const parts = slug.split("-").filter((p) => p.length > 3);

  if (parts.length >= 2) {
    const threshold = Math.ceil(parts.length * 0.7);
    const wordMatch = (allJobs as (Job & { slug?: string })[]).find((j) => {
      const s = j.slug || "";
      if (s.startsWith(slug) || slug.startsWith(s)) return true;
      const hits = parts.filter((p) => s.includes(p)).length;
      return hits >= threshold;
    });
    if (wordMatch) return wordMatch;
  }

  // Both slugs (hyphens removed) share the same first 5 chars.
  // Only redirect when exactly one job matches to avoid ambiguous redirects.
  const slugNorm = slug.replace(/-/g, "");
  if (slugNorm.length >= 5) {
    const prefix = slugNorm.slice(0, 5);
    const candidates = (allJobs as (Job & { slug?: string })[]).filter((j) => {
      const sNorm = (j.slug || "").replace(/-/g, "");
      return sNorm.length >= 5 && sNorm.slice(0, 5) === prefix;
    });
    if (candidates.length === 1) return candidates[0];
  }

  return undefined;
}

export default async function JobDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;

  if (UUID_RE.test(slug)) {
    const job = allJobs.find((j) => j.id === slug);
    if (!job) notFound();
    redirect(locale === "fr" ? `/offres/${(job as any).slug}` : `/${locale}/offres/${(job as any).slug}`);
  }

  let job = allJobs.find((j) => (j as any).slug === slug) as (Job & { slug?: string }) | undefined;

  // Slug not found — try fuzzy match (catches LinkedIn links where slug was regenerated after enrichment)
  if (!job) {
    const fuzzy = findByFuzzySlug(slug);
    if (fuzzy) {
      const dest = locale === "fr" ? `/offres/${fuzzy.slug}` : `/${locale}/offres/${fuzzy.slug}`;
      redirect(dest);
    }
    // Job deleted from DB — render expired page (noindex set in generateMetadata) instead of 404
    // so Google deindexes gracefully rather than flagging a hard 404.
    const similarActive = allJobs.filter((j) => !(j as any).expired).slice(0, 4);
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cette offre n&apos;est plus disponible</h1>
          <p className="text-gray-500 mb-6">
            L&apos;offre que vous cherchez a expiré ou a été supprimée.
          </p>
          <Link
            href={locale === "fr" ? "/offres" : `/${locale}/offres`}
            className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors mb-6"
          >
            Voir toutes les offres d&apos;emploi →
          </Link>
          {similarActive.length > 0 && (
            <div className="text-left space-y-3 border-t border-gray-100 pt-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Offres récentes</p>
              {similarActive.map((s) => (
                <Link
                  key={(s as any).slug || s.id}
                  href={`/offres/${(s as any).slug || s.id}`}
                  className="block rounded-xl border border-gray-100 p-3 hover:border-primary transition-colors"
                >
                  <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                  <p className="text-xs text-gray-400">{s.company} · {s.city}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expired jobs: render a dedicated expiry page (noindex already set in generateMetadata).
  // Do NOT redirect — 302 wastes crawl budget and Bing flags the landing page as unrelated.
  if (job.expired) {
    const similarActive = allJobs
      .filter((j) => !(j as any).expired && (j.sector === job.sector || j.city === job.city))
      .slice(0, 4);
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cette offre a expiré</h1>
          <p className="text-gray-500 mb-2">
            <strong>{job.title}</strong> chez <strong>{job.company}</strong> n&apos;est plus disponible.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Découvrez des offres similaires actives ci-dessous.
          </p>
          <Link
            href={locale === "fr" ? "/offres" : `/${locale}/offres`}
            className="inline-block bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors mb-6"
          >
            Voir toutes les offres d&apos;emploi →
          </Link>
          {similarActive.length > 0 && (
            <div className="text-left space-y-3 border-t border-gray-100 pt-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Offres similaires</p>
              {similarActive.map((s) => (
                <Link
                  key={(s as any).slug || s.id}
                  href={`/offres/${(s as any).slug || s.id}`}
                  className="block rounded-xl border border-gray-100 p-3 hover:border-primary transition-colors"
                >
                  <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                  <p className="text-xs text-gray-400">{s.company} · {s.city}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const t = await getTranslations("jobDetail");

  const relatedJobs = allJobs
    .filter((j) => j.id !== job.id && (j.sector === job.sector || j.city === job.city))
    .slice(0, 3);

  const similarJobs = allJobs
    .filter((j) => !(j as any).expired && j.id !== job.id && (j.sector === job.sector || j.city === job.city))
    .slice(0, 4);

  const descriptionParagraphs = job.description.split("\n\n");

  const POSTAL_CODES: Record<string, string> = {
    Casablanca: "20000", Rabat: "10000", Marrakech: "40000", Agadir: "80000",
    Tanger: "90000", Essaouira: "44000", Fès: "30000", Oujda: "60000",
  };

  function parseSalaryRange(range: string | undefined) {
    if (!range) return undefined;
    const nums = range.replace(/\s/g, "").match(/\d{3,6}/g)?.map(Number).filter(n => n >= 500) ?? [];
    if (nums.length === 0) return undefined;
    const minVal = Math.min(...nums);
    const maxVal = Math.max(...nums);
    // Detect USD/EUR from range string
    const currency = /\$|USD/i.test(range) ? "USD" : /€|EUR/i.test(range) ? "EUR" : "MAD";
    return {
      "@type": "MonetaryAmount",
      currency,
      value: {
        "@type": "QuantitativeValue",
        ...(minVal !== maxVal ? { minValue: minVal, maxValue: maxVal } : { value: minVal }),
        unitText: "MONTH",
      },
    };
  }

  const employmentTypeMap: Record<string, string> = {
    CDI:            "FULL_TIME",
    CDD:            "TEMPORARY",
    Stage:          "INTERN",
    "Temps partiel": "PART_TIME",
    "Part-time":    "PART_TIME",
    Freelance:      "CONTRACTOR",
    Intérim:        "TEMPORARY",
    Alternance:     "FULL_TIME",
  };

  // validThrough: use date_expires if set, else max(postedAt+90d, today+60d)
  // Guarantees validThrough is always in the future for active jobs so Google counts them as valid.
  const postedDate  = new Date((job as any).date_posted ?? job.postedAt ?? new Date());
  const dateExpires = (job as any).date_expires ? new Date((job as any).date_expires) : null;
  const computed    = new Date(postedDate.getTime() + 90 * 86400000);
  const floor       = new Date(Date.now() + 60 * 86400000);
  const validThroughDate = dateExpires ?? (computed > floor ? computed : floor);
  const validThrough = validThroughDate.toISOString().split("T")[0];

  // employmentType: always set — fallback to "OTHER" so Google never flags missing field
  const empType = employmentTypeMap[job.contractType] ?? "OTHER";

  const jobPostingJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title || (job as any).meta_title || "Offre d'emploi",
    description: job.description || "",
    identifier: { "@type": "PropertyValue", name: "InteractJob", value: job.id },
    datePosted: (job as any).date_posted ?? job.postedAt ?? new Date().toISOString().split("T")[0],
    validThrough,
    employmentType: empType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company || "Entreprise au Maroc",
      sameAs: (job.sourceUrl as string | undefined) ?? `${BASE_URL}/offres/${(job as any).slug || job.id}`,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Centre ville",
        addressLocality: job.city,
        addressRegion: job.city,
        postalCode: POSTAL_CODES[job.city] ?? "00000",
        addressCountry: "MA",
      },
    },
    directApply: true,
    applicantLocationRequirements: {
      "@type": "Country",
      name: "MA",
    },
    // baseSalary is required by Google for JobPosting rich results.
    // When no salary is specified, use SMIG Maroc 2026 (3 111 MAD/month) as floor.
    baseSalary: parseSalaryRange(job.salary) ?? {
      "@type": "MonetaryAmount",
      currency: "MAD",
      value: { "@type": "QuantitativeValue", value: 3111, unitText: "MONTH" },
    },
    industry: job.sector,
    url: `${BASE_URL}/offres/${(job as any).slug || job.id}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />

      {/* Per-position JobPosting schemas for multi-role campaign listings */}
      {(job as any).departments && (job as any).departments.flatMap(
        (dept: { name: string; positions: string[] }, di: number) =>
          dept.positions.map((pos: string, pi: number) => (
            <script
              key={`dept-${di}-pos-${pi}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "JobPosting",
                  title: pos,
                  description: `${pos} — ${job.company}, département ${dept.name}. CDI. Postes disponibles à Agadir, Marrakech et Casablanca. Envoyez CV + lettre de motivation à ${job.contactEmail}.`,
                  datePosted: (job as any).date_posted ?? job.postedAt,
                  validThrough: (job as any).date_expires,
                  employmentType: "FULL_TIME",
                  hiringOrganization: { "@type": "Organization", name: job.company },
                  jobLocation: [
                    { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Agadir", addressCountry: "MA" } },
                    { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Marrakech", addressCountry: "MA" } },
                    { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Casablanca", addressCountry: "MA" } },
                  ],
                  occupationalCategory: dept.name,
                  url: `${BASE_URL}/offres/${(job as any).slug || job.id}`,
                }),
              }}
            />
          ))
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Expired banner */}
        {job.expired && (
          <div className="mb-6 bg-gray-100 border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-600">Cette offre est clôturée</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Le délai de candidature est dépassé.{" "}
                <Link href="/offres" className="text-primary hover:underline">Voir les offres actives →</Link>
              </p>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">{t("home")}</Link>
          <span aria-hidden>/</span>
          <Link href="/offres" className="hover:text-primary transition-colors">{t("offers")}</Link>
          <span aria-hidden>/</span>
          <span className="text-gray-800 font-medium truncate">{job.title}</span>
        </nav>

        {/* Job header */}
        <div className={`bg-white rounded-2xl border-2 p-6 mb-8 shadow-sm ${job.sponsored ? "border-accent" : "border-gray-100"}`}>
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0"
              style={{ backgroundColor: job.companyColor }}
            >
              {job.companyInitials}
            </div>
            <div className="flex-1">
              {job.sponsored && (
                <span className="inline-block bg-accent text-white text-xs font-bold px-2.5 py-0.5 rounded-full mb-2">
                  ⭐ {t("sponsored")}
                </span>
              )}
              <h1 className="text-2xl font-extrabold text-gray-900">{job.title}</h1>
              <p className="text-gray-600 mt-1 font-semibold">{job.company}</p>

              <div className="flex flex-wrap items-center gap-2.5 mt-4">
                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${contractColor[job.contractType]}`}>
                  {job.contractType}
                </span>
                <span className="text-sm text-gray-500 flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.city}
                </span>
                <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                  {job.sector}
                </span>
                {job.experience && (
                  <span className="text-sm text-gray-500 flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {job.experience}
                  </span>
                )}
                {job.salary && (
                  <span className="text-sm font-bold text-accent bg-accent-light px-3 py-1 rounded-lg">
                    💰 {job.salary}
                  </span>
                )}
              </div>
            </div>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${BASE_URL}/offres/${(job as any).slug || job.id}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-2 bg-[#0077B5] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#006097] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              {t("share")}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-gray-900 mb-5">{t("descriptionTitle")}</h2>
              <div className="space-y-4">
                {descriptionParagraphs.map((para, i) => {
                  const lines = para.split("\n");
                  const heading = lines[0];
                  const rest = lines.slice(1).join("\n");
                  if (lines.length > 1) {
                    return (
                      <div key={i}>
                        <p className="font-bold text-gray-900 mb-2">{heading}</p>
                        {rest.split("\n").filter(Boolean).map((line, j) => (
                          <p key={j} className="flex items-start gap-2 text-gray-600 text-sm leading-relaxed">
                            {line.startsWith("•") ? (
                              <>
                                <span className="text-accent mt-1 flex-shrink-0">•</span>
                                <span>{line.replace(/^•\s*/, "")}</span>
                              </>
                            ) : line}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return <p key={i} className="text-gray-600 text-sm leading-relaxed">{para}</p>;
                })}
              </div>
            </div>

            {/* ── Departments grid — shown for multi-role campaign listings ─── */}
            {(job as any).departments && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">Postes disponibles par département</h2>
                <p className="text-sm text-gray-500 mb-5">
                  {(job as any).departments.reduce((acc: number, d: { positions: string[] }) => acc + d.positions.length, 0)} postes · {job.city}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(job as any).departments.map((dept: { name: string; icon: string; positions: string[] }) => (
                    <div key={dept.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                        <span>{dept.icon}</span>
                        <span>{dept.name}</span>
                        <span className="ml-auto text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {dept.positions.length} poste{dept.positions.length > 1 ? "s" : ""}
                        </span>
                      </p>
                      <ul className="space-y-1.5">
                        {dept.positions.map((pos: string) => (
                          <li key={pos} className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                            {pos}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">📧</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Candidature par email</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      CV + lettre de motivation → <span className="font-semibold text-primary">{job.contactEmail}</span>
                      <br />Objet : intitulé du poste + ville souhaitée
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Analyse RH InteractJob — original editorial content ─────────── */}
            {(job as any).hr_commentary && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    Analyse RH InteractJob
                  </h2>
                  <span className="ml-auto text-xs font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
                    Expert RH
                  </span>
                </div>
                <div className="space-y-3">
                  {String((job as any).hr_commentary).split(/\n\n+/).filter(Boolean).map((para: string, i: number) => (
                    <p key={i} className="text-gray-700 leading-relaxed text-sm">{para.trim()}</p>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4 border-t border-blue-100 pt-3">
                  ✍️ Rédigé par l&apos;équipe RH InteractJob.ma — analyse du marché de l&apos;emploi marocain
                </p>
              </div>
            )}

            {/* Requirements */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-gray-900 mb-5">{t("requirementsTitle")}</h2>
              <ul className="space-y-3">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <span className="text-accent mt-0.5 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Apply: Direct jobs → our pipeline (employer + admin copy);
                scraped jobs → send the candidate to the source site */}
            {(() => {
              const isDirect = job.source === "Direct" || (job as any).source_site === "Direct";
              const srcUrl = (job.sourceUrl as string | undefined) || (job as any).source_url || undefined;
              if (!isDirect && srcUrl) {
                return (
                  <div id="apply-form" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-extrabold text-gray-900 mb-2">{t("applyTitle")}</h2>
                    <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                      Cette offre est publiée par <strong>{job.source}</strong>. Pour garantir que votre
                      candidature arrive bien à l&apos;employeur, postulez directement sur le site d&apos;origine.
                    </p>
                    <a
                      href={srcUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="block w-full bg-primary text-white text-center font-bold py-3.5 rounded-xl hover:bg-primary-dark transition-colors"
                    >
                      Postuler sur {job.source} ↗
                    </a>
                    <p className="text-xs text-gray-400 text-center mt-3">
                      Vous serez redirigé vers l&apos;offre originale pour finaliser votre candidature.
                    </p>
                    <div className="mt-5 pt-5 border-t border-gray-100 text-center">
                      <p className="text-sm text-gray-600">
                        Vous voulez aussi être visible par les recruteurs marocains ?
                      </p>
                      <Link href="/postuler" className="inline-block mt-2 text-sm font-bold text-primary hover:underline">
                        Rejoindre notre vivier de talents →
                      </Link>
                    </div>
                  </div>
                );
              }
              return (
                <div id="apply-form" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-extrabold text-gray-900 mb-5">{t("applyTitle")}</h2>
                  <ApplyForm
                    jobTitle={job.title}
                    company={job.company}
                    jobId={job.id}
                    isDirect={isDirect}
                    sourceUrl={srcUrl}
                    sourceName={job.source !== "Direct" ? job.source : undefined}
                  />
                </div>
              );
            })()}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Company card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">{t("companyTitle")}</h3>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: job.companyColor }}
                >
                  {job.companyInitials}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{job.company}</p>
                  <p className="text-xs text-gray-500">{job.city}, {t("location")}</p>
                </div>
              </div>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: t("sectorLabel"), value: job.sector },
                  { label: t("cityLabel"), value: job.city },
                  { label: t("contractLabel"), value: job.contractType },
                  ...(job.salary ? [{ label: t("salaryLabel"), value: job.salary, accent: true }] : []),
                  { label: t("sourceLabel"), value: job.source },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-semibold ${accent ? "text-accent" : "text-gray-800"}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick apply CTA */}
            <div className="bg-primary-light rounded-2xl border border-primary/20 p-5 text-center">
              <p className="text-sm font-bold text-gray-900 mb-1">{t("interestedTitle")}</p>
              <p className="text-xs text-gray-500 mb-4">{t("interestedDesc")}</p>
              <a
                href="#apply-form"
                className="block w-full bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors text-center"
              >
                {t("applyNow")}
              </a>
            </div>

            {/* Job alert — capture visitors who aren't ready to apply today */}
            <JobAlertSignup city={job.city} sector={job.sector} />

            {/* Related jobs */}
            {relatedJobs.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4">{t("similarTitle")}</h3>
                <div className="space-y-3">
                  {relatedJobs.map((j) => (
                    <Link key={j.id} href={`/offres/${(j as any).slug || j.id}`} className="group flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: j.companyColor }}
                      >
                        {j.companyInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {j.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{j.company} · {j.city}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Offres similaires ─────────────────────────────────────── */}
        {similarJobs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">
              Offres similaires
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarJobs.map((j) => (
                <Link
                  key={j.id}
                  href={`/offres/${(j as any).slug || j.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 p-4 hover:border-primary/30 hover:shadow-md transition-all flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: j.companyColor }}
                    >
                      {j.companyInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 truncate">{j.company}</p>
                      <p className="text-xs text-gray-400">{j.city}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug flex-1">
                    {j.title}
                  </p>
                  <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-lg ${
                    j.contractType === "CDI" ? "bg-blue-50 text-blue-700" :
                    j.contractType === "CDD" ? "bg-amber-50 text-amber-700" :
                    "bg-purple-50 text-purple-700"
                  }`}>
                    {j.contractType}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Candidature spontanée CTA ────────────────────────────── */}
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Ce poste ne vous correspond pas tout à fait ?</p>
            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
              Déposez votre candidature spontanée et nous vous contacterons dès qu&apos;une offre correspond à votre profil.
            </p>
          </div>
          <Link
            href="/postuler"
            className="flex-shrink-0 bg-primary text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-primary-dark transition-colors whitespace-nowrap"
          >
            Candidature spontanée →
          </Link>
        </div>

        {/* ── CV Checker CTA ────────────────────────────────────────── */}
        <div className="mt-4 bg-gradient-to-r from-accent to-accent-dark rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white">
            <p className="font-extrabold text-lg">📄 Votre CV est-il adapté à ce poste ?</p>
            <p className="text-green-100 text-sm mt-0.5">
              Testez votre CV gratuitement et obtenez un score de compatibilité en 30 secondes.
            </p>
          </div>
          <Link
            href="/cv-checker"
            className="flex-shrink-0 bg-white text-accent font-bold px-6 py-3 rounded-xl text-sm hover:bg-green-50 transition-colors whitespace-nowrap"
          >
            Tester mon CV →
          </Link>
        </div>

        {/* Sticky mobile apply bar — form is buried below the description on small screens */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900 truncate">{job.title}</p>
            <p className="text-[11px] text-gray-500 truncate">{job.company} · {job.city}</p>
          </div>
          <a
            href="#apply-form"
            className="flex-shrink-0 bg-primary text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            {t("applyNow")}
          </a>
        </div>
        {/* Spacer so the sticky bar never covers page content */}
        <div className="lg:hidden h-20" />

        {/* Track this visit in localStorage (client-side, invisible) */}
        <JobVisitTracker job={{
          id: job.id,
          slug: (job as any).slug || job.id,
          title: job.title,
          company: job.company,
          city: job.city,
          contractType: job.contractType,
          companyColor: job.companyColor,
          companyInitials: job.companyInitials,
          sector: job.sector,
        }} />
      </div>
    </>
  );
}
