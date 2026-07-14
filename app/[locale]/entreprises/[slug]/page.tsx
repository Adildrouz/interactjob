import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { connectDB } from "@/lib/db";
import { EmployerHub, type IEmployerHub } from "@/lib/models/EmployerHub";
import FaqAccordion from "@/components/FaqAccordion";
import JobAlertSignup from "@/components/JobAlertSignup";
import jobsData from "@/data/jobs.json";

export const revalidate = 3600;

const BASE_URL = "https://www.interactjob.ma";

type Job = {
  id: string; slug: string; title: string; company: string; description?: string;
  city: string; sector: string; contractType: string; expired?: boolean;
};
const allJobs = jobsData as unknown as Job[];

async function getEmployer(slug: string): Promise<IEmployerHub | null> {
  await connectDB();
  const doc = await EmployerHub.findOne({ slug, is_active: true }).lean();
  return doc as unknown as IEmployerHub | null;
}

function matchingJobs(keywords: string[]): Job[] {
  const kws = keywords.map((k) => k.toLowerCase());
  return allJobs.filter((j) => {
    if (j.expired) return false;
    const haystack = `${j.title} ${j.company} ${j.description || ""}`.toLowerCase();
    return kws.some((kw) => haystack.includes(kw));
  });
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> }
): Promise<Metadata> {
  const { locale, slug } = await params;
  const employer = await getEmployer(slug);
  if (!employer) return {};

  const isAr = locale === "ar";
  const canonical = locale === "fr" ? `${BASE_URL}/entreprises/${slug}` : `${BASE_URL}/${locale}/entreprises/${slug}`;
  const alternateBase = `${BASE_URL}/entreprises/${slug}`;

  const title = isAr
    ? `${employer.name_ar} التوظيف 2026 — عروض شغل ${employer.name_ar} | InteractJob`
    : `${employer.name} Recrutement 2026 — Offres d'Emploi ${employer.name} | InteractJob`;

  const description = isAr
    ? employer.description_ar.slice(0, 155)
    : employer.description.slice(0, 155);

  const keywords = isAr
    ? [`${employer.name_ar}`, `التسجيل في ${employer.name_ar}`, `عروض عمل ${employer.name_ar}`, `${employer.name_ar} التوظيف`]
    : [`${employer.name} recrutement`, `${employer.name} postuler`, `${employer.name} offres emploi`, `${employer.name} inscription`];

  return {
    title,
    description,
    keywords,
    openGraph: { title, description, url: canonical, type: "website", siteName: "InteractJob", locale: isAr ? "ar_MA" : "fr_MA" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
    alternates: {
      canonical,
      languages: { fr: alternateBase, en: `${BASE_URL}/en/entreprises/${slug}`, ar: `${BASE_URL}/ar/entreprises/${slug}` },
    },
  };
}

export default async function EmployerHubPage(
  { params }: { params: Promise<{ locale: string; slug: string }> }
) {
  const { locale, slug } = await params;
  const employer = await getEmployer(slug);
  if (!employer) notFound();

  const isAr = locale === "ar";
  const canonical = `${BASE_URL}/entreprises/${slug}`;
  const related = matchingJobs(employer.job_match_keywords);

  const howToApply = isAr ? employer.how_to_apply_ar : employer.how_to_apply;
  const howToRegister = isAr ? employer.how_to_register_ar : employer.how_to_register;
  const faqRaw = isAr ? employer.faq_ar : employer.faq;
  const faqItems = faqRaw.map((f) => ({ q: f.question, a: f.answer }));
  const description = isAr ? employer.description_ar : employer.description;
  const name = isAr ? employer.name_ar : employer.name;

  const ui = {
    home: isAr ? "الرئيسية" : "Accueil",
    entreprises: isAr ? "الشركات والمؤسسات" : "Entreprises",
    intro: isAr ? "نبذة" : "À propos",
    offersTitle: isAr ? `عروض بعقد ${employer.name_ar} (إدماج)` : `Offres avec contrat ${employer.name} (IDMAJ)`,
    offersNote: isAr
      ? `هذه الإعلانات نشرها مشغلون شركاء يستعملون آلية عقد ${employer.name_ar}/إدماج، وهي ليست منشورة من طرف ${employer.name_ar} مباشرة.`
      : `Ces offres, publiées par des employeurs partenaires, mentionnent un contrat d'insertion ${employer.name}/IDMAJ — elles ne sont pas publiées par ${employer.name} elle-même.`,
    noOffers: isAr ? "لا توجد حاليا عروض تشير إلى هذا النوع من العقود." : "Aucune offre avec ce type de contrat n'est disponible actuellement.",
    howToApply: isAr ? `كيفية التقديم عبر ${employer.name_ar}` : `Comment postuler via ${employer.name}`,
    howToRegister: isAr ? `كيفية التسجيل في ${employer.name_ar}` : `Comment s'inscrire sur ${employer.name}`,
    faqTitle: isAr ? "الأسئلة الشائعة" : "Questions fréquentes",
    alertTitle: isAr ? `عروض ${employer.name_ar} بالبريد الإلكتروني` : `Recevez les nouvelles offres ${employer.name} par email`,
    officialLink: isAr ? `الموقع الرسمي ${employer.name_ar}` : `Site officiel ${employer.name}`,
    officialNote: isAr
      ? "التقديم الفعلي يتم عبر الموقع الرسمي — هذه الصفحة دليل مجاني لمساعدتك."
      : "Les candidatures officielles se font sur le site de l'agence — cette page est un guide gratuit pour vous accompagner.",
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: employer.name,
    alternateName: employer.name_ar,
    url: employer.official_website,
    sameAs: [employer.official_website],
  };

  const faqJsonLd = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  } : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: ui.home, item: BASE_URL },
      { "@type": "ListItem", position: 2, name: ui.entreprises, item: `${BASE_URL}/entreprises` },
      { "@type": "ListItem", position: 3, name, item: canonical },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir={isAr ? "rtl" : "ltr"}>
        {/* Breadcrumb */}
        <nav className={`flex items-center gap-2 text-sm text-gray-400 mb-6 ${isAr ? "flex-row-reverse justify-end" : ""}`}>
          <Link href="/" className="hover:text-primary">{ui.home}</Link>
          <span>/</span>
          <Link href="/entreprises" className="hover:text-primary">{ui.entreprises}</Link>
          <span>/</span>
          <span className="text-gray-600">{name}</span>
        </nav>

        {/* Hero */}
        <div className="mb-8">
          <p className="text-sm font-bold text-primary mb-2">{employer.sector}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-3">
            {isAr ? `${employer.name_ar} التوظيف 2026 — جميع عروض الشغل` : `${employer.name} Recrutement 2026 — Toutes les offres d'emploi`}
          </h1>
          <p className="text-base text-gray-600 leading-relaxed">{description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Offers */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                {ui.offersTitle} ({related.length})
              </h2>
              <p className="text-xs text-gray-400 mb-3">{ui.offersNote}</p>
              {related.length > 0 ? (
                <div className="space-y-3">
                  {related.map((j) => (
                    <Link
                      key={j.id}
                      href={`/offres/${j.slug}`}
                      className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-primary transition-all"
                    >
                      <p className="font-semibold text-gray-900 text-sm leading-snug">{j.title}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">{j.company}</span>
                        <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">{j.city}</span>
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{j.contractType}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 text-center">
                  <p className="text-sm text-gray-500">{ui.noOffers}</p>
                </div>
              )}
            </div>

            {/* How to apply */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">{ui.howToApply}</h2>
              <div className="space-y-3">
                {howToApply.map((step, i) => (
                  <div key={i} className="flex gap-3 bg-white rounded-xl border border-gray-100 p-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How to register */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">{ui.howToRegister}</h2>
              <div className="space-y-3">
                {howToRegister.map((step, i) => (
                  <div key={i} className="flex gap-3 bg-white rounded-xl border border-gray-100 p-4">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{step.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ */}
            {faqItems.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-3">{ui.faqTitle}</h2>
                <FaqAccordion items={faqItems} isAr={isAr} />
              </div>
            )}

            <a
              href={employer.official_website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              {ui.officialLink} ↗
            </a>
            <p className="text-xs text-gray-400 mt-2">{ui.officialNote}</p>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <JobAlertSignup keyword={employer.name} sourcePage={`entreprises_${slug}`} locale={isAr ? "ar" : "fr"} />

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3">{ui.officialLink}</h2>
              <a href={employer.official_website} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline py-1">
                {employer.official_website.replace(/^https?:\/\//, "")} ↗
              </a>
            </div>

            <Link href="/entreprises" className="block text-center text-sm text-primary hover:underline py-2">
              {isAr ? `← جميع الشركات والمؤسسات` : `← Toutes les entreprises`}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
