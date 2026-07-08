import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import concoursData from "@/data/concours.json";
import jobsData from "@/data/jobs.json";
import { Concours } from "@/types";
import { buildFrArAlternates } from "@/lib/hreflang";
import { localizedTitle, localizedOrganization, localizedSummary } from "@/lib/concours";

const BASE_URL = "https://www.interactjob.ma";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "مباريات وزارة الداخلية بالمغرب 2026"
      : "Concours Ministère de l'Intérieur Maroc 2026",
    description: isAr
      ? "جميع مباريات توظيف وزارة الداخلية المغربية 2026: مفتشون، مهندسو الدولة، مراقبون. آخر الآجال، الشروط والنتائج."
      : "Tous les concours de recrutement du Ministère de l'Intérieur Maroc 2026 : inspecteurs, ingénieurs d'État, contrôleurs. Dates limites, conditions et résultats.",
    alternates: buildFrArAlternates("/concours/ministere-interieur"),
    keywords: isAr
      ? ["مباريات وزارة الداخلية المغرب 2026", "توظيف وزارة الداخلية", "مفتشو الإدارة الترابية", "مهندسو الدولة مباراة المغرب"]
      : ["concours ministère intérieur maroc 2026", "recrutement ministère intérieur", "inspecteurs administration territoriale", "ingénieurs état maroc concours"],
    robots: { index: locale !== "en", follow: true },
  };
}

type Job = { id: string; slug: string; title: string; company: string; city: string; contractType: string; sector: string; expired?: boolean };
const allJobs = jobsData as unknown as Job[];
const allConcours = concoursData as Concours[];

const miConcours = allConcours.filter(c =>
  c.organization_fr.toLowerCase().includes("intérieur") ||
  c.organization_fr.toLowerCase().includes("interieur") ||
  c.organization_fr.toLowerCase().includes("sûreté") ||
  c.organization_fr.toLowerCase().includes("surete")
);

const relatedJobs = allJobs
  .filter(j => !j.expired && ["Finance", "Administratif", "RH", "IT"].includes(j.sector))
  .slice(0, 4);

function isExpired(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

const PROFILES = [
  { label_fr: "Inspecteurs administration territoriale", label_ar: "مفتشو الإدارة الترابية", niveau_fr: "Ingénieur / Master", niveau_ar: "مهندس / ماستر" },
  { label_fr: "Ingénieurs d'État (génie civil, hydraulique, SIG)", label_ar: "مهندسو الدولة (الهندسة المدنية، الهيدروليك، نظم المعلومات الجغرافية)", niveau_fr: "Ingénieur", niveau_ar: "مهندس" },
  { label_fr: "Contrôleurs de gestion et logistique", label_ar: "مراقبو التدبير واللوجستيك", niveau_fr: "Bac+3 / Licence", niveau_ar: "بكالوريا+3 / الإجازة" },
  { label_fr: "Techniciens spécialisés (topographie, infographie)", label_ar: "تقنيون متخصصون (الطوبوغرافيا، الإنفوغرافيا)", niveau_fr: "Bac+2", niveau_ar: "بكالوريا+2" },
  { label_fr: "Officiers et inspecteurs de police (DGSN)", label_ar: "ضباط ومفتشو الشرطة (المديرية العامة للأمن الوطني)", niveau_fr: "Tous niveaux", niveau_ar: "جميع المستويات" },
  { label_fr: "Secrétaires administratifs", label_ar: "كتّاب إداريون", niveau_fr: "Bac", niveau_ar: "البكالوريا" },
];

export default async function MinistereInterieurPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const t = await getTranslations("concours");

  const activeMI  = miConcours.filter(c => !isExpired(c.deadline));
  const expiredMI = miConcours.filter(c => isExpired(c.deadline));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isAr ? "مباريات وزارة الداخلية بالمغرب 2026" : "Concours Ministère de l'Intérieur Maroc 2026",
    description: isAr
      ? "قائمة مباريات توظيف وزارة الداخلية المغربية لسنة 2026"
      : "Liste des concours de recrutement du Ministère de l'Intérieur du Maroc pour 2026",
    url: `${BASE_URL}/${isAr ? "ar/" : ""}concours/ministere-interieur`,
    numberOfItems: miConcours.length,
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
          <span className="text-gray-600">{isAr ? "وزارة الداخلية" : "Ministère de l'Intérieur"}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-bold text-primary mb-2">
            {isAr ? "الوظيفة العمومية — وزارة الداخلية" : "Fonction Publique — Ministère de l'Intérieur"}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-2">
            {isAr ? "مباريات وزارة الداخلية بالمغرب 2026" : "Concours Ministère de l'Intérieur Maroc 2026"}
          </h1>
          {!isAr && (
            <p className="text-base text-gray-500 text-right leading-relaxed" dir="rtl">
              مباريات وزارة الداخلية — المملكة المغربية
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <p className="text-sm font-semibold text-blue-800 mb-2">{isAr ? "نبذة" : "À propos"}</p>
              <p className="text-sm text-blue-700 leading-relaxed">
                {isAr
                  ? "تُعد وزارة الداخلية من أكبر الموظِّفين في الوظيفة العمومية المغربية. تنظم بانتظام مباريات لمناصب مفتشي الإدارة الترابية، ومهندسي الدولة، والمراقبين، والتقنيين في تخصصات عديدة."
                  : "Le Ministère de l'Intérieur est l'un des plus grands recruteurs de la fonction publique marocaine. Il organise régulièrement des concours pour des postes d'inspecteurs de l'administration territoriale, d'ingénieurs d'État, de contrôleurs et de techniciens dans de nombreuses spécialités."}
              </p>
            </div>

            {/* Active concours */}
            {activeMI.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  {t("openTitle", { count: activeMI.length })}
                </h2>
                <div className="space-y-3">
                  {activeMI.map(c => (
                    <Link
                      key={c.id}
                      href={`/concours/${c.slug}` as any}
                      className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-primary transition-all"
                    >
                      <p className="text-xs font-semibold text-primary mb-1">{localizedOrganization(c, locale)}</p>
                      <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{localizedTitle(c, locale)}</p>
                      {localizedSummary(c, locale) && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{localizedSummary(c, locale)}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {!!c.postes && (
                          <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">
                            {t("postesCount", { count: c.postes })}
                          </span>
                        )}
                        {c.niveau && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            {c.niveau}
                          </span>
                        )}
                        {c.deadline && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                            {t("closureLabel", { date: new Date(c.deadline).toLocaleDateString(isAr ? "ar-MA" : "fr-MA", { day: "numeric", month: "long", year: "numeric" }) })}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeMI.length === 0 && (
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 text-center">
                <p className="text-sm text-gray-500">{isAr ? "لا توجد مباراة نشطة حالياً." : "Aucun concours actif pour le moment."}</p>
                <p className="text-xs text-gray-400 mt-1">{isAr ? "اطّلع على قسم المباريات المنتهية أدناه." : "Consultez la section des concours clôturés ci-dessous."}</p>
              </div>
            )}

            {/* Profiles */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-base font-bold text-gray-800 mb-3">{isAr ? "الفئات المهنية الأكثر توظيفاً" : "Profils habituellement recrutés"}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROFILES.map(p => (
                  <div key={p.label_fr} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5 flex-shrink-0">▸</span>
                    <div>
                      <p className="text-sm text-gray-800 font-medium">{isAr ? p.label_ar : p.label_fr}</p>
                      <p className="text-xs text-gray-400">{isAr ? p.niveau_ar : p.niveau_fr}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expired */}
            {expiredMI.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-gray-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                  {t("closedTitle")} ({expiredMI.length})
                </h2>
                <div className="space-y-2 opacity-60">
                  {expiredMI.map(c => (
                    <Link
                      key={c.id}
                      href={`/concours/${c.slug}` as any}
                      className="block bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-300 transition-all"
                    >
                      <p className="text-sm text-gray-600 line-clamp-2">{localizedTitle(c, locale)}</p>
                      <div className="flex gap-2 mt-2">
                        {!!c.postes && (
                          <span className="text-xs text-gray-400">{t("postesCount", { count: c.postes })}</span>
                        )}
                        {c.deadline && (
                          <span className="text-xs text-gray-400">— {new Date(c.deadline).toLocaleDateString(isAr ? "ar-MA" : "fr-MA", { day: "numeric", month: "long", year: "numeric" })}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <a
              href="https://emploi-public.ma"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
            >
              {isAr ? "الترشح عبر emploi-public.ma ←" : "Candidater sur emploi-public.ma ↗"}
            </a>
            <p className="text-xs text-gray-400 mt-2">
              {isAr ? "تتم الترشيحات لوزارة الداخلية عبر البوابة الرسمية emploi-public.ma." : "Les candidatures au Ministère de l'Intérieur se font via le portail officiel emploi-public.ma."}
            </p>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3">{isAr ? "روابط مفيدة" : "Liens utiles"}</h2>
              <div className="space-y-2">
                <a href="https://emploi-public.ma" target="_blank" rel="noopener noreferrer"
                   className="block text-xs text-primary hover:underline py-1 border-b border-gray-50">
                  {isAr ? "emploi-public.ma — إيداع الترشيح" : "emploi-public.ma — dépôt de candidature"}
                </a>
                <a href="https://www.interieur.gov.ma" target="_blank" rel="noopener noreferrer"
                   className="block text-xs text-primary hover:underline py-1">
                  {isAr ? "interieur.gov.ma — الموقع الرسمي" : "interieur.gov.ma — site officiel"}
                </a>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-500 mb-3">{isAr ? "نوّعوا فرصكم — اكتشفوا أيضاً القطاع الخاص:" : "Diversifiez vos chances — explorez aussi le secteur privé :"}</p>
                <Link
                  href="/offres"
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  {isAr ? "عروض القطاع الخاص" : "Offres d'emploi privé"}
                </Link>
                <Link
                  href="/postuler"
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  {t("depositCv")}
                </Link>
              </div>
            </div>

            {relatedJobs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold text-gray-700 mb-3">{t("privateSectorLabel")}</h2>
                <div className="space-y-2">
                  {relatedJobs.map(j => (
                    <Link
                      key={j.id}
                      href={`/offres/${j.slug}`}
                      className="block text-xs text-gray-600 hover:text-primary leading-snug py-1 border-b border-gray-50 last:border-0"
                    >
                      {j.title.slice(0, 70)}{j.title.length > 70 ? "…" : ""}
                    </Link>
                  ))}
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
