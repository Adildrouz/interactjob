import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import jobs from "@/data/jobs.json";
import { Job } from "@/types";
import ApplyForm from "@/components/ApplyForm";

const allJobs = jobs as Job[];
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
  if (!job) return {};

  const title       = (job as any).meta_title       || `${job.title} – ${job.company} | ${job.city}`;
  const description = (job as any).meta_description || `Offre d'emploi ${job.contractType} : ${job.title} chez ${job.company} à ${job.city}. Postulez maintenant sur InteractJob.`;
  const canonical   = `${BASE_URL}/offres/${(job as any).slug || job.id}`;

  // Expired jobs: tell Google not to index them — saves crawl budget
  if (job.expired) {
    return { title, robots: { index: false, follow: false } };
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

export default async function JobDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;

  if (UUID_RE.test(slug)) {
    const job = allJobs.find((j) => j.id === slug);
    if (!job) notFound();
    redirect(locale === "fr" ? `/offres/${(job as any).slug}` : `/${locale}/offres/${(job as any).slug}`);
  }

  const job = allJobs.find((j) => (j as any).slug === slug);
  if (!job) notFound();

  // Expired jobs: send users to active listings rather than showing a dead page
  if (job.expired) {
    redirect(locale === "fr" ? "/offres" : `/${locale}/offres`);
  }

  const t = await getTranslations("jobDetail");

  const relatedJobs = allJobs
    .filter((j) => j.id !== job.id && (j.sector === job.sector || j.city === job.city))
    .slice(0, 3);

  const descriptionParagraphs = job.description.split("\n\n");

  const POSTAL_CODES: Record<string, string> = {
    Casablanca: "20000", Rabat: "10000", Marrakech: "40000", Agadir: "80000",
    Tanger: "90000", Essaouira: "44000", Fès: "30000", Oujda: "60000",
  };

  function parseSalaryRange(range: string | undefined) {
    if (!range) return undefined;
    const min = range.replace(/\s/g, "").match(/\d{4,6}/)?.[0];
    if (!min) return undefined;
    return {
      "@type": "MonetaryAmount",
      currency: "MAD",
      value: { "@type": "QuantitativeValue", value: Number(min), unitText: "MONTH" },
    };
  }

  const employmentTypeMap = { CDI: "FULL_TIME", CDD: "TEMPORARY", Stage: "INTERN" } as const;

  const jobPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: { "@type": "PropertyValue", name: "InteractJob", value: job.id },
    datePosted: job.postedAt,
    validThrough: new Date(new Date(job.postedAt).getTime() + 30 * 86400000).toISOString().split("T")[0],
    employmentType: employmentTypeMap[job.contractType],
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      ...(job.sourceUrl && { sameAs: job.sourceUrl }),
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
    ...((job as any).salary_range ? { baseSalary: parseSalaryRange((job as any).salary_range) } : {}),
    industry: job.sector,
    url: `${BASE_URL}/offres/${(job as any).slug || job.id}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />

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

            {/* Apply form */}
            <div id="apply-form" className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-gray-900 mb-5">{t("applyTitle")}</h2>
              <ApplyForm jobTitle={job.title} company={job.company} />
            </div>
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
      </div>
    </>
  );
}
