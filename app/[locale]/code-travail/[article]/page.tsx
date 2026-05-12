import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import codeTravailFr from "@/data/code-travail.json";
import codeTravailAr from "@/data/code-travail-ar.json";

const BASE_URL = "https://www.interactjob.ma";

type Article = {
  id: string;
  numero: string;
  titre: string;
  theme: string;
  livre: string;
  chapitre: string;
  texte: string;
  resume: string;
  tags: string[];
  slug: string;
};

const THEME_ICONS: Record<string, string> = {
  "Dispositions générales": "📋", "أحكام عامة": "📋",
  "Droits fondamentaux": "⚖️", "الحقوق الأساسية": "⚖️",
  "Contrat de travail": "📄", "عقد الشغل": "📄",
  "Période d'essai": "🔍", "فترة التجربة": "🔍",
  "Licenciement": "🚪", "الفصل من العمل": "🚪",
  "Préavis & Indemnités": "💰", "الإخطار المسبق والتعويضات": "💰",
  "Durée du travail": "⏰", "مدة الشغل": "⏰",
  "Congés & Repos": "🏖️", "العطل والراحة": "🏖️",
  "Salaire & SMIG": "💵", "الأجر والحد الأدنى": "💵",
  "Maternité & Famille": "👶", "الأمومة والأسرة": "👶",
  "Hygiène & Sécurité": "🦺", "النظافة والسلامة": "🦺",
  "Syndicats": "🤝", "النقابات المهنية": "🤝",
  "Délégués du personnel": "👥", "مندوبو الأجراء": "👥",
  "Relations collectives": "📢", "العلاقات الجماعية": "📢",
  "Apprentissage & Formation": "🎓", "التمهين والتكوين": "🎓",
  "Travail des femmes": "👩‍💼", "شغل المرأة": "👩‍💼",
  "Travail des jeunes": "🧑", "شغل الأحداث": "🧑",
  "Inspection du travail": "🔎", "تفتيش الشغل": "🔎",
  "Dispositions pénales": "⚠️", "أحكام جنائية": "⚠️",
};

function getArticles(locale: string) {
  return (locale === "ar" ? codeTravailAr : codeTravailFr) as Article[];
}

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    (codeTravailFr as Article[]).map((a) => ({ locale, article: a.slug }))
  );
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; article: string }> }
): Promise<Metadata> {
  const { locale, article: slug } = await params;
  const articles = getArticles(locale);
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};

  const isAr = locale === "ar";
  const title = isAr
    ? `الفصل ${article.numero} – ${article.titre} | مدونة الشغل المغربية`
    : `Article ${article.numero} – ${article.titre} | Code du travail Maroc`;
  const canonical = `${BASE_URL}/code-travail/${article.slug}`;

  return {
    title,
    description: article.resume,
    keywords: [...article.tags, isAr ? "مدونة الشغل المغرب" : "code du travail maroc", isAr ? "قانون الشغل" : "droit du travail"],
    openGraph: {
      title,
      description: article.resume,
      url: canonical,
      type: "article",
      siteName: "InteractJob",
      locale: isAr ? "ar_MA" : "fr_MA",
    },
    alternates: {
      canonical,
      languages: {
        fr: canonical,
        en: `${BASE_URL}/en/code-travail/${article.slug}`,
        ar: `${BASE_URL}/ar/code-travail/${article.slug}`,
      },
    },
  };
}

export default async function ArticleCodeTravailPage({
  params,
}: {
  params: Promise<{ locale: string; article: string }>;
}) {
  const { locale, article: slug } = await params;
  const isAr = locale === "ar";
  const articles = getArticles(locale);
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = articles
    .filter((a) => a.id !== article.id && a.theme === article.theme)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: isAr ? `الفصل ${article.numero} – ${article.titre}` : `Article ${article.numero} – ${article.titre}`,
    description: article.resume,
    url: `${BASE_URL}/code-travail/${article.slug}`,
    publisher: {
      "@type": "Organization",
      name: "InteractJob",
      url: BASE_URL,
    },
    about: {
      "@type": "Legislation",
      name: isAr ? `الفصل ${article.numero} من مدونة الشغل المغربية` : `Article ${article.numero} du Code du travail marocain`,
      legislationType: isAr ? "قانون" : "Loi",
      jurisdiction: isAr ? "المغرب" : "Maroc",
    },
    inLanguage: isAr ? "ar-MA" : "fr-MA",
  };

  const ui = {
    home: isAr ? "الرئيسية" : "Accueil",
    code: isAr ? "مدونة الشغل" : "Code du travail",
    article: isAr ? `الفصل ${article.numero}` : `Article ${article.numero}`,
    summary: isAr ? "ملخص" : "En résumé",
    official: isAr ? "النص الرسمي" : "Texte officiel",
    keywords: isAr ? "الكلمات المفتاحية" : "Mots-clés associés",
    infoTitle: isAr ? "معلومات" : "Informations",
    number: isAr ? "رقم الفصل" : "Numéro",
    theme: isAr ? "الموضوع" : "Thème",
    book: isAr ? "الكتاب" : "Livre",
    law: isAr ? "القانون" : "Loi",
    country: isAr ? "البلد" : "Pays",
    morocco: isAr ? "المغرب" : "Maroc",
    ctaTitle: isAr ? "ابحث عن عمل" : "Chercher un emploi",
    ctaDesc: isAr ? "مئات العروض في المغرب" : "Des centaines d'offres au Maroc",
    ctaBtn: isAr ? "عرض العروض" : "Voir les offres",
    relatedTitle: isAr ? "فصول من نفس الموضوع" : "Articles du même thème",
    allArticles: isAr ? "جميع الفصول ←" : "Tous les articles →",
    disclaimer: isAr ? "تنبيه قانوني" : "Avertissement juridique",
    disclaimerBody: isAr
      ? "هذه المعلومات للإرشاد فقط. لأي سؤال قانوني محدد، استشر محامياً متخصصاً في قانون الشغل أو مفتشية الشغل القريبة منك."
      : "Cet article est fourni à titre informatif uniquement. Pour toute question juridique, consultez un avocat spécialisé ou l'Inspection du travail.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir={isAr ? "rtl" : "ltr"}>
        {/* Breadcrumb */}
        <nav className={`text-sm text-gray-500 mb-8 flex items-center gap-2 flex-wrap ${isAr ? "flex-row-reverse" : ""}`}>
          <Link href="/" className="hover:text-primary transition-colors">{ui.home}</Link>
          <span>/</span>
          <Link href={"/code-travail" as any} className="hover:text-primary transition-colors">
            {ui.code}
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{ui.article}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Article header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className={`flex items-start gap-4 mb-5 ${isAr ? "flex-row-reverse" : ""}`}>
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                  {article.numero}
                </div>
                <div className={`flex-1 ${isAr ? "text-right" : ""}`}>
                  <div className={`flex items-center gap-2 flex-wrap mb-2 ${isAr ? "justify-end" : ""}`}>
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {THEME_ICONS[article.theme] || "📋"} {article.theme}
                    </span>
                    <span className="text-xs text-gray-400">{article.livre}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                    {isAr ? `الفصل ${article.numero}` : `Article ${article.numero}`} – {article.titre}
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">{article.chapitre}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-primary-light border border-primary/20 rounded-xl p-4 mb-5">
                <p className={`text-xs font-bold text-primary mb-1 uppercase tracking-wide ${isAr ? "text-right" : ""}`}>
                  {ui.summary}
                </p>
                <p className={`text-sm text-gray-700 leading-relaxed ${isAr ? "text-right" : ""}`}>
                  {article.resume}
                </p>
              </div>

              {/* Full text */}
              <div>
                <h2 className={`text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 ${isAr ? "text-right" : ""}`}>
                  {ui.official}
                </h2>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className={`text-sm text-gray-700 leading-relaxed italic ${isAr ? "text-right" : ""}`}>
                    &ldquo;{article.texte}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className={`text-sm font-bold text-gray-700 mb-3 ${isAr ? "text-right" : ""}`}>
                {ui.keywords}
              </h2>
              <div className={`flex flex-wrap gap-2 ${isAr ? "justify-end" : ""}`}>
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-sm text-primary bg-primary-light px-3 py-1 rounded-full border border-primary/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className={`bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3 ${isAr ? "flex-row-reverse text-right" : ""}`}>
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="font-bold text-amber-900 text-sm">{ui.disclaimer}</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">{ui.disclaimerBody}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className={`font-bold text-gray-900 text-sm mb-4 ${isAr ? "text-right" : ""}`}>
                {ui.infoTitle}
              </h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: ui.number, value: `${isAr ? "الفصل" : "Article"} ${article.numero}` },
                  { label: ui.theme, value: article.theme },
                  { label: ui.book, value: article.livre },
                  { label: ui.law, value: isAr ? "رقم 65.99" : "n° 65-99" },
                  { label: ui.country, value: ui.morocco },
                ].map(({ label, value }) => (
                  <div key={label} className={`flex justify-between py-2 border-b border-gray-50 last:border-0 ${isAr ? "flex-row-reverse" : ""}`}>
                    <span className="text-gray-400">{label}</span>
                    <span className="font-semibold text-gray-800 text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-primary rounded-2xl p-5 text-white text-center">
              <p className="text-lg mb-1">🔍</p>
              <p className="font-bold text-sm mb-1">{ui.ctaTitle}</p>
              <p className="text-xs text-blue-100 mb-3">{ui.ctaDesc}</p>
              <Link
                href="/offres"
                className="block bg-white text-primary font-bold py-2 rounded-xl text-sm hover:bg-blue-50 transition-colors"
              >
                {ui.ctaBtn}
              </Link>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className={`font-bold text-gray-900 text-sm mb-4 ${isAr ? "text-right" : ""}`}>
                  {ui.relatedTitle}
                </h3>
                <div className="space-y-3">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/code-travail/${rel.slug}` as any}
                      className={`group flex items-start gap-3 ${isAr ? "flex-row-reverse" : ""}`}
                    >
                      <span className="w-9 h-9 bg-primary-light text-primary rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        {rel.numero}
                      </span>
                      <div className={`min-w-0 ${isAr ? "text-right" : ""}`}>
                        <p className="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {rel.titre}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href={"/code-travail" as any}
                  className={`block text-xs text-primary font-medium mt-4 hover:underline ${isAr ? "text-right" : "text-center"}`}
                >
                  {ui.allArticles}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
