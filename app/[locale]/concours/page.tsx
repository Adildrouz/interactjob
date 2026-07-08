import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import concoursData from "@/data/concours.json";
import jobsData from "@/data/jobs.json";
import { Concours } from "@/types";
import { buildFrArAlternates } from "@/lib/hreflang";
import { formatDate, isExpired, inferConcoursSector, inferRegion, localizedTitle, localizedOrganization } from "@/lib/concours";
import ConcoursExplorer, { type EnrichedConcours } from "./ConcoursExplorer";
import ConcoursAlertForm from "@/components/ConcoursAlertForm";
import TrackedLink from "@/components/TrackedLink";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "مباريات التوظيف بالمغرب — الوظيفة العمومية | InteractJob"
      : "Concours Fonction Publique Maroc 2026 — Résultats & Offres",
    description: isAr
      ? "جميع مباريات توظيف الوظيفة العمومية المغربية: الوزارات، الجماعات الترابية، المؤسسات العمومية. نتائج مباراة المجلس الأعلى للسلطة القضائية 2026، وزارة الداخلية وأخرى. تحديث يومي."
      : "Tous les concours de recrutement de la fonction publique marocaine : ministères, collectivités, établissements publics. Résultats CSPJ 2026, Ministère de l'Intérieur et plus. Mis à jour quotidiennement.",
    alternates: buildFrArAlternates("/concours"),
    keywords: isAr
      ? ["مباريات التوظيف المغرب 2026", "مباريات الوظيفة العمومية", "نتائج مباراة المجلس الأعلى للسلطة القضائية 2026", "مباريات وزارة الداخلية"]
      : ["concours fonction publique maroc 2026", "résultats concours CSPJ 2026", "concours ministère intérieur", "recrutement état maroc"],
    robots: { index: locale !== "en", follow: true },
  };
}

const allConcours = concoursData as Concours[];

type Job = { id: string; slug: string; title: string; company: string; city: string; contractType: string; sector: string; expired?: boolean };
const allJobs = jobsData as unknown as Job[];

const PRIVATE_SECTORS = ["Finance", "IT", "Commerce", "RH", "Marketing", "Industrie", "Logistique", "Santé", "BTP", "Éducation"];
const privateJobs = allJobs
  .filter(j => !j.expired && PRIVATE_SECTORS.includes(j.sector))
  .slice(0, 6);

const RECENT_CLOSED_COUNT = 15;

export default async function ConcoursPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const t = await getTranslations("concours");

  const active  = allConcours.filter(c => !isExpired(c.deadline));
  const expired = allConcours
    .filter(c => isExpired(c.deadline))
    .sort((a, b) => new Date(b.deadline!).getTime() - new Date(a.deadline!).getTime());
  const recentClosed = expired.slice(0, RECENT_CLOSED_COUNT);

  const enrichedActive: EnrichedConcours[] = active.map((c) => ({
    ...c,
    _sector: inferConcoursSector(c),
    _region: inferRegion(c),
  }));

  const latestPosted = allConcours.reduce<string | null>((latest, c) => {
    if (!c.datePosted) return latest;
    return !latest || c.datePosted > latest ? c.datePosted : latest;
  }, null);
  const isFreshToday = latestPosted === new Date().toISOString().split("T")[0];

  const FAQ_ITEMS = [
    { q: t("faqQ1"), a: t("faqA1") },
    { q: t("faqQ2"), a: t("faqA2") },
    { q: t("faqQ3"), a: t("faqA3") },
    { q: t("faqQ4"), a: t("faqA4") },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">{t("badge")}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-2">
          {t("activeSummary", { count: active.length })} · {isFreshToday ? t("updatedToday") : t("updatedOn", { date: formatDate(latestPosted, locale) })}
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link href="/concours/cspj-2026" className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors">
            {t("linkCspj")}
          </Link>
          <Link href="/concours/ministere-interieur" className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors">
            {t("linkMinistere")}
          </Link>
          <Link href={"/concours/guide-candidat" as any} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium hover:bg-primary/20 transition-colors">
            {t("linkGuide")}
          </Link>
          <Link href="/offres" className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium hover:bg-gray-200 transition-colors">
            {t("linkPrivateOffers")}
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary">{active.length}</p>
          <p className="text-xs text-gray-500 mt-1">{t("statActiveLabel")}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">
            {allConcours.reduce((sum, c) => sum + (c.postes || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t("statPostesLabel")}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-500">
            {enrichedActive.filter(c => {
              if (!c.deadline) return false;
              const diff = (new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
              return diff >= 0 && diff <= 7;
            }).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">{t("statUrgentLabel")}</p>
        </div>
      </div>

      {/* Préparez votre candidature — placed above the (potentially long) listing so it's always seen */}
      <section className="mb-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <h2 className="text-lg font-bold mb-2">{t("prepareTitle")}</h2>
        <p className="text-blue-100 text-sm leading-relaxed mb-4">
          {t("prepareDesc")}
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <TrackedLink
            href={"/cv-checker" as any}
            event="concours_cta_click"
            eventParams={{ cta: "cv_checker", page: "listing" }}
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
          >
            {t("ctaCvChecker")}
          </TrackedLink>
          <TrackedLink
            href={"/generateur-cv" as any}
            event="concours_cta_click"
            eventParams={{ cta: "generateur_cv", page: "listing" }}
            className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
          >
            {t("ctaCvGenerator")}
          </TrackedLink>
          <TrackedLink
            href={"/postuler" as any}
            event="concours_cta_click"
            eventParams={{ cta: "postuler", page: "listing" }}
            className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-5 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
          >
            {t("ctaSpontaneous")}
          </TrackedLink>
        </div>
      </section>

      {/* Alertes concours */}
      <section className="mb-8">
        <ConcoursAlertForm />
      </section>

      {/* Interactive filter bar + closing-soon + results */}
      <ConcoursExplorer active={enrichedActive} locale={locale} />

      {/* Private sector CTA */}
      {privateJobs.length > 0 && (
        <section className="mb-10 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{t("privateSectorLabel")}</p>
              <h2 className="text-lg font-bold text-gray-900">{t("privateSectorTitle")}</h2>
              <p className="text-sm text-gray-500 mt-1">{t("privateSectorDesc")}</p>
            </div>
            <Link href="/offres" className="flex-shrink-0 text-xs font-semibold text-primary hover:underline whitespace-nowrap">
              {t("viewAllOffersArrow")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {privateJobs.map(j => (
              <Link
                key={j.id}
                href={`/offres/${j.slug}`}
                className="bg-white rounded-xl border border-blue-100 p-4 hover:shadow-md hover:border-primary transition-all"
              >
                <p className="text-xs font-semibold text-primary mb-1">{j.company}</p>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{j.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">{j.city}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">{j.contractType}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/offres"
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
            >
              {t("allJobOffers")}
            </Link>
            <Link
              href="/postuler"
              className="inline-flex items-center gap-2 bg-white text-primary border border-primary px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              {t("depositCv")}
            </Link>
          </div>
        </section>
      )}

      {/* Intro (SEO + LLM) */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          {t("introTitle")}
        </h2>
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>{t("introP1")}</p>
          <p>{t("introP2")}</p>
          <p>{t("introP3")}</p>
          <p>
            {t("introP4a")}
            <Link href={"/concours/guide-candidat" as any} className="text-primary font-semibold hover:underline">{t("introP4Link")}</Link>
            {t("introP4b")}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t("faqTitle")}</h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{item.q}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Expired */}
      {expired.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
            {t("closedTitle")} ({expired.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {recentClosed.map(c => (
              <Link
                key={c.id}
                href={`/concours/${c.slug}` as any}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-primary transition-all"
              >
                <p className="text-xs font-semibold text-primary mb-1">{localizedOrganization(c, locale)}</p>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{localizedTitle(c, locale)}</h3>
              </Link>
            ))}
          </div>
          {expired.length > RECENT_CLOSED_COUNT && (
            <Link
              href={"/concours/archives" as any}
              className="mt-4 block w-full text-center text-sm font-semibold text-primary bg-white border border-gray-200 rounded-xl py-3 hover:bg-gray-50 transition-colors"
            >
              {t("viewAllArchives", { count: expired.length })}
            </Link>
          )}
        </section>
      )}

      {/* Source attribution */}
      <div className="mt-12 pt-6 border-t border-gray-100 text-xs text-gray-400">
        {t("sourcesText")}
      </div>
    </div>
  );
}
