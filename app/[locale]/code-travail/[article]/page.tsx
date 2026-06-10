import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import codeTravailFr from "@/data/code-travail.json";
import codeTravailAr from "@/data/code-travail-ar.json";
import enrichedData from "@/data/code-travail-enriched.json";
import PrintButton from "@/components/PrintButton";
import IndemniteCalculator from "@/components/IndemniteCalculator";

// Articles that get the indemnity calculator widget
const CALCULATOR_ARTICLES = new Set(["art-52", "art-53", "art-43", "art-44", "art-74"]);

const BASE_URL = "https://www.interactjob.ma";
const UPDATED_DATE = "2024-01-15";
const UPDATED_LABEL_FR = "Mis à jour : janvier 2024 — Loi n° 65-99";
const UPDATED_LABEL_AR = "محيَّن : يناير 2024 — القانون رقم 65.99";

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

type EnrichedEntry = {
  id: string;
  concretement?: string;
  faq?: { q: string; a: string }[];
  faq_ar?: { q: string; a: string }[];
  related?: string[];
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

// Index by ID for O(1) lookup
const enrichedIndex: Record<string, EnrichedEntry> = Object.fromEntries(
  (enrichedData as EnrichedEntry[]).map((e) => [e.id, e])
);
const frById: Record<string, Article> = Object.fromEntries(
  (codeTravailFr as Article[]).map((a) => [a.id, a])
);
const arById: Record<string, Article> = Object.fromEntries(
  (codeTravailAr as Article[]).map((a) => [a.id, a])
);

// Sort articles by article number for prev/next navigation
const sortedFr = [...(codeTravailFr as Article[])].sort(
  (a, b) => parseInt(a.numero) - parseInt(b.numero)
);

function getArticles(locale: string) {
  return (locale === "ar" ? codeTravailAr : codeTravailFr) as Article[];
}

function getPrevNext(articleId: string) {
  const idx = sortedFr.findIndex((a) => a.id === articleId);
  return {
    prev: idx > 0 ? sortedFr[idx - 1] : null,
    next: idx < sortedFr.length - 1 ? sortedFr[idx + 1] : null,
  };
}

// Static SEO overrides — applied only for the fr locale (canonical)
const SEO_OVERRIDES: Record<string, { title: string; description: string }> = {
  "article-53-indemnite-licenciement": {
    title: "Article 53 Code du Travail Maroc — Calcul Indemnité de Licenciement",
    description: "Barème officiel de l'indemnité de licenciement au Maroc (Art. 53) : 96h, 144h, 192h, 240h selon l'ancienneté. Calcul, exemples et conditions.",
  },
  "article-52-licenciement-conditions": {
    title: "Article 52 Code du Travail Maroc — Conditions du Licenciement",
    description: "Conditions légales du licenciement au Maroc : motifs valables, procédure obligatoire, protection du salarié. Article 52 Loi 65-99.",
  },
  "article-74-retraite-indemnite": {
    title: "Article 74 Code du Travail Maroc — Indemnité de Départ à la Retraite",
    description: "Calcul, montant et conditions de l'indemnité de retraite au Maroc. Texte officiel + exemples pratiques selon l'article 74.",
  },
  "article-43-preavis-licenciement": {
    title: "Article 43 Code du Travail Maroc — Durée du Préavis de Licenciement",
    description: "Durée légale du préavis selon la catégorie (cadre, employé, ouvrier). Article 43 du Code du Travail marocain expliqué.",
  },
  "article-44-indemnite-preavis": {
    title: "Article 44 Code du Travail Maroc — Indemnité Compensatrice de Préavis",
    description: "Que se passe-t-il si l'employeur ne respecte pas le préavis ? Calcul de l'indemnité compensatrice selon l'article 44.",
  },
  "article-430-delegues-salaries-entreprises": {
    title: "Article 430 Code du Travail Maroc — Délégués des Salariés",
    description: "Obligations employeur, élection et mandat des délégués des salariés. Article 430 Code du Travail marocain expliqué.",
  },
  "article-432-election-delegues": {
    title: "Article 432 Code du Travail Maroc — Élection Délégués des Salariés",
    description: "Conditions, procédure d'élection et réclamations. Article 432 du Code du Travail Maroc.",
  },
  "article-436-protection-delegues": {
    title: "Article 436 Code du Travail Maroc — Protection des Délégués du Personnel",
    description: "Droits et protection légale contre le licenciement des délégués des salariés selon l'article 436.",
  },
  "article-17-duree-maximale-cdd": {
    title: "Article 17 Code du Travail Maroc — Durée Maximale CDD",
    description: "Quelle est la durée maximale d'un CDD au Maroc ? Renouvellement, cas autorisés selon l'article 17.",
  },
  "article-16-cdd-cas-autorises": {
    title: "Article 16 Code du Travail Maroc — CDD : Cas Autorisés",
    description: "Quand peut-on conclure un CDD ? Cas légaux autorisés et interdictions selon l'article 16.",
  },
  "article-63-demission-salarie": {
    title: "Article 63 Code du Travail Maroc — Démission du Salarié",
    description: "Comment démissionner légalement ? Préavis obligatoire, droits du salarié et procédure selon l'article 63.",
  },
  "article-205-repos-hebdomadaire": {
    title: "Article 205 Code du Travail Maroc — Repos Hebdomadaire",
    description: "Durée, modalités et exceptions du repos hebdomadaire obligatoire selon l'article 205.",
  },
};

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
  const override = !isAr ? SEO_OVERRIDES[slug] : undefined;

  const title = override?.title ?? (isAr
    ? `الفصل ${article.numero} — ${article.titre} | مدونة الشغل المغربية`
    : `Article ${article.numero} Code du Travail Maroc — ${article.titre}`);
  const description = override?.description ?? article.resume;
  const canonical = `${BASE_URL}/code-travail/${article.slug}`;

  return {
    title,
    description,
    keywords: [...article.tags, isAr ? "مدونة الشغل المغرب" : "code du travail maroc", isAr ? "قانون الشغل" : "droit du travail"],
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "InteractJob",
      locale: isAr ? "ar_MA" : "fr_MA",
      publishedTime: UPDATED_DATE,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  // Enriched data (same id for FR and AR)
  const enriched = enrichedIndex[article.id] as EnrichedEntry | undefined;
  const faq = isAr ? (enriched?.faq_ar ?? enriched?.faq) : enriched?.faq;

  // Prev / Next (always based on FR numeric order)
  const frArticle = frById[article.id];
  const { prev: prevFr, next: nextFr } = getPrevNext(article.id);
  const prev = prevFr ? (isAr ? arById[prevFr.id] : prevFr) : null;
  const next = nextFr ? (isAr ? arById[nextFr.id] : nextFr) : null;

  // Related articles (enriched > same-theme fallback)
  const relatedIds = enriched?.related ?? [];
  const related = relatedIds
    .map((id) => (isAr ? arById[id] : frById[id]))
    .filter(Boolean)
    .slice(0, 4) as Article[];
  // fallback to same theme if no related
  const relatedDisplay = related.length > 0
    ? related
    : articles.filter((a) => a.id !== article.id && a.theme === article.theme).slice(0, 4);

  // ── JSON-LD ──────────────────────────────────────────────────────────────────

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "InteractJob", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: isAr ? "مدونة الشغل" : "Code du travail", item: `${BASE_URL}/code-travail` },
      {
        "@type": "ListItem",
        position: 3,
        name: isAr ? `الفصل ${article.numero}` : `Article ${article.numero}`,
        item: `${BASE_URL}/code-travail/${article.slug}`,
      },
    ],
  };

  const legalDocJsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalDocument",
    "@id": `${BASE_URL}/code-travail/${article.slug}`,
    name: isAr
      ? `الفصل ${article.numero} — ${article.titre} — مدونة الشغل المغربية`
      : `Article ${article.numero} — ${article.titre} — Code du Travail Maroc`,
    description: article.resume,
    url: `${BASE_URL}/code-travail/${article.slug}`,
    jurisdiction: { "@type": "AdministrativeArea", name: isAr ? "المغرب" : "Morocco" },
    legislationIdentifier: "Loi n° 65-99",
    legislationType: isAr ? "قانون" : "Loi",
    datePublished: "2004-09-08",
    dateModified: UPDATED_DATE,
    inLanguage: isAr ? ["ar"] : ["fr", "en", "ar"],
    author: {
      "@type": "Person",
      name: "Adil Drouz",
      url: `${BASE_URL}/a-propos`,
    },
    publisher: {
      "@type": "Organization",
      name: "InteractJob",
      url: BASE_URL,
      logo: `${BASE_URL}/InteractJob-Logo.png`,
    },
    about: {
      "@type": "Thing",
      name: isAr ? article.theme : article.theme,
    },
  };

  const faqJsonLd = faq && faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;

  // ── UI labels ────────────────────────────────────────────────────────────────
  const ui = {
    home: isAr ? "الرئيسية" : "Accueil",
    code: isAr ? "مدونة الشغل" : "Code du travail",
    articleLabel: isAr ? `الفصل ${article.numero}` : `Article ${article.numero}`,
    whatLawSays: isAr ? "ما تقوله القانون" : "Ce que dit la loi",
    officialText: isAr ? "النص الرسمي" : "Texte officiel",
    concretement: isAr ? "ما يعنيه ذلك في الواقع" : "Ce que ça veut dire concrètement",
    faqTitle: isAr ? "أسئلة شائعة" : "Questions fréquentes",
    relatedTitle: isAr ? "فصول من نفس الموضوع" : "Articles liés",
    keywords: isAr ? "الكلمات المفتاحية" : "Mots-clés",
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
    allArticles: isAr ? "جميع الفصول" : "Tous les articles",
    disclaimer: isAr ? "تنبيه قانوني" : "Avertissement juridique",
    disclaimerBody: isAr
      ? "هذه المعلومات للإرشاد فقط. لأي سؤال قانوني محدد، استشر محامياً متخصصاً في قانون الشغل أو مفتشية الشغل القريبة منك."
      : "Cet article est fourni à titre informatif uniquement. Pour toute question juridique, consultez un avocat spécialisé ou l'Inspection du travail.",
    prevArticle: isAr ? "الفصل السابق" : "Article précédent",
    nextArticle: isAr ? "الفصل التالي" : "Article suivant",
    printLabel: isAr ? "طباعة" : "Imprimer",
    updatedLabel: isAr ? UPDATED_LABEL_AR : UPDATED_LABEL_FR,
    summary: isAr ? "ملخص" : "En résumé",
  };

  return (
    <>
      {/* ── Structured data ──────────────────────────────────────────────────── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(legalDocJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:py-4" dir={isAr ? "rtl" : "ltr"}>

        {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
        <nav className={`text-sm text-gray-500 mb-6 flex items-center gap-2 flex-wrap print:hidden ${isAr ? "flex-row-reverse" : ""}`}>
          <Link href="/" className="hover:text-primary transition-colors">{ui.home}</Link>
          <span>/</span>
          <Link href={"/code-travail" as any} className="hover:text-primary transition-colors">{ui.code}</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{ui.articleLabel}</span>
        </nav>

        {/* ── Top bar: updated date + print ──────────────────────────────────── */}
        <div className={`flex items-center justify-between mb-6 text-xs text-gray-400 print:hidden ${isAr ? "flex-row-reverse" : ""}`}>
          <span className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">{ui.updatedLabel}</span>
          <PrintButton label={ui.printLabel} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Main column ──────────────────────────────────────────────────── */}
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
                    {isAr ? `الفصل ${article.numero}` : `Article ${article.numero}`} — {article.titre}
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

              {/* Official text */}
              <h2 className={`text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 ${isAr ? "text-right" : ""}`}>
                {ui.officialText}
              </h2>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className={`text-sm text-gray-700 leading-relaxed italic ${isAr ? "text-right" : ""}`}>
                  &ldquo;{article.texte}&rdquo;
                </p>
              </div>
            </div>

            {/* Concrètement section */}
            {enriched?.concretement && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className={`text-base font-bold text-gray-900 mb-3 flex items-center gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
                  <span className="text-lg">💡</span>
                  {ui.concretement}
                </h2>
                <p className={`text-sm text-gray-700 leading-relaxed ${isAr ? "text-right" : ""}`}>
                  {enriched.concretement}
                </p>
              </div>
            )}

            {/* FAQ accordion */}
            {faq && faq.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className={`text-base font-bold text-gray-900 mb-4 flex items-center gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
                  <span className="text-lg">❓</span>
                  {ui.faqTitle}
                </h2>
                <div className="space-y-2">
                  {faq.map(({ q, a }, i) => (
                    <details
                      key={i}
                      className="group border border-gray-100 rounded-xl overflow-hidden"
                    >
                      <summary className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none bg-gray-50 hover:bg-primary-light transition-colors ${isAr ? "flex-row-reverse" : ""}`}>
                        <span className={`text-sm font-medium text-gray-800 ${isAr ? "text-right" : ""}`}>{q}</span>
                        <svg
                          className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className={`px-4 py-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 ${isAr ? "text-right" : ""}`}>
                        {a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Indemnity calculator for relevant articles */}
            {CALCULATOR_ARTICLES.has(article.id) && (
              <IndemniteCalculator locale={locale} />
            )}

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

            {/* Prev / Next navigation */}
            {(prev || next) && (
              <div className={`flex items-center justify-between gap-4 print:hidden ${isAr ? "flex-row-reverse" : ""}`}>
                {prev ? (
                  <Link
                    href={`/code-travail/${prev.slug}` as any}
                    className="flex-1 group flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <span className={`text-gray-400 group-hover:text-primary transition-colors ${isAr ? "rotate-180" : ""}`}>←</span>
                    <div>
                      <p className="text-xs text-gray-400">{ui.prevArticle}</p>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                        {isAr ? `الفصل ${prev.numero}` : `Art. ${prev.numero}`} — {prev.titre}
                      </p>
                    </div>
                  </Link>
                ) : <div className="flex-1" />}

                {next ? (
                  <Link
                    href={`/code-travail/${next.slug}` as any}
                    className={`flex-1 group flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-primary/40 hover:shadow-sm transition-all ${isAr ? "" : "justify-end text-right"}`}
                  >
                    <div>
                      <p className="text-xs text-gray-400">{ui.nextArticle}</p>
                      <p className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                        {isAr ? `الفصل ${next.numero}` : `Art. ${next.numero}`} — {next.titre}
                      </p>
                    </div>
                    <span className={`text-gray-400 group-hover:text-primary transition-colors ${isAr ? "rotate-180" : ""}`}>→</span>
                  </Link>
                ) : <div className="flex-1" />}
              </div>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────────── */}
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
            <div className="bg-primary rounded-2xl p-5 text-white text-center print:hidden">
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
            {relatedDisplay.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className={`font-bold text-gray-900 text-sm mb-4 ${isAr ? "text-right" : ""}`}>
                  {ui.relatedTitle}
                </h3>
                <div className="space-y-3">
                  {relatedDisplay.map((rel) => (
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
                  {ui.allArticles} →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
