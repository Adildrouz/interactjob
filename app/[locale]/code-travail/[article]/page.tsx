import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import codeTravailFr from "@/data/code-travail.json";
import codeTravailAr from "@/data/code-travail-ar.json";
import enrichedData from "@/data/code-travail-enriched.json";
import FaqAccordion from "@/components/FaqAccordion";
import PrintButton from "@/components/PrintButton";

const BASE_URL = "https://www.interactjob.ma";
const LAST_UPDATED = "Janvier 2024";
const LAST_UPDATED_AR = "يناير 2024";

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

type Enriched = {
  id: string;
  concretement: string;
  analyse?: string;
  faq: { q: string; a: string }[];
  faq_ar: { q: string; a: string }[];
  related: string[];
};

const enrichedById: Record<string, Enriched> = Object.fromEntries(
  (enrichedData as Enriched[]).map((e) => [e.id, e])
);

const frById: Record<string, Article> = Object.fromEntries(
  (codeTravailFr as Article[]).map((a) => [a.id, a])
);

const frBySlug: Record<string, Article> = Object.fromEntries(
  (codeTravailFr as Article[]).map((a) => [a.slug, a])
);

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

const ALL_SLUGS = (codeTravailFr as Article[]).map((a) => a.slug);

const SEO_OVERRIDES: Record<string, { title: string; description: string }> = {
  "article-53-indemnite-licenciement": {
    title: "Indemnité de Licenciement Maroc — Article 53 Code du Travail",
    description: "Barème officiel : 96h, 144h, 192h, 240h selon l'ancienneté. Calculez votre indemnité de licenciement au Maroc avec l'article 53 du Code du Travail.",
  },
  "article-52-licenciement-abusif": {
    title: "Licenciement Abusif au Maroc — Article 52 Code du Travail",
    description: "Conditions du licenciement légal, motifs valables et droits du salarié. Article 52 du Code du Travail marocain expliqué.",
  },
  "article-74-retraite-indemnite": {
    title: "Indemnité de Retraite au Maroc — Article 74 Code du Travail",
    description: "Calcul, montant et conditions de l'indemnité de retraite au Maroc. Barème officiel + exemples pratiques selon l'article 74 du Code du Travail (Loi 65-99).",
  },
  "article-43-preavis": {
    title: "Préavis de Licenciement au Maroc — Article 43 Code du Travail",
    description: "Durée légale du préavis selon la catégorie (cadre, employé, ouvrier). Article 43 du Code du Travail marocain.",
  },
  "article-44-indemnite-preavis": {
    title: "Indemnité de Préavis — Article 44 Code du Travail Maroc",
    description: "Droits du salarié si le préavis n'est pas respecté. Heures d'absence pour chercher un emploi. Article 44 du Code du Travail.",
  },
  "article-430-delegues-salaries-entreprises": {
    title: "Délégués des Salariés au Maroc — Article 430 Code du Travail",
    description: "Obligations employeur, élection et mandat 6 ans des délégués des salariés. Article 430 Code du Travail marocain expliqué.",
  },
  "article-432-election-delegues": {
    title: "Élection Délégués des Salariés — Article 432 Code du Travail",
    description: "Conditions, procédure d'élection et réclamations individuelles ou collectives. Article 432 du Code du Travail Maroc.",
  },
  "article-436-protection-delegues": {
    title: "Protection Délégués des Salariés — Article 436 Code du Travail",
    description: "Droits et protection légale contre le licenciement des délégués des salariés au Maroc selon l'article 436.",
  },
  "article-17-duree-maximale-cdd": {
    title: "Durée Maximale CDD au Maroc — Article 17 Code du Travail",
    description: "Quelle est la durée maximale d'un CDD au Maroc ? Renouvellement, cas autorisés selon l'article 17 du Code du Travail.",
  },
  "article-16-cdd-cas-autorises": {
    title: "CDD au Maroc : Cas Autorisés — Article 16 Code du Travail",
    description: "Quand peut-on conclure un CDD ? Cas légaux autorisés et interdictions selon l'article 16 du Code du Travail marocain.",
  },
  "article-63-demission-salarie": {
    title: "Démission au Maroc : Droits du Salarié — Article 63",
    description: "Comment démissionner légalement ? Préavis obligatoire, droits du salarié et procédure selon l'article 63 du Code du Travail.",
  },
  "article-205-repos-hebdomadaire": {
    title: "Repos Hebdomadaire au Maroc — Article 205 Code du Travail",
    description: "Durée, modalités et exceptions du repos hebdomadaire obligatoire selon l'article 205 du Code du Travail.",
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
    : `Article ${article.numero} Code du Travail Maroc — ${article.titre} | InteractJob`);
  const description = override?.description ?? article.resume;
  const canonical = `${BASE_URL}/code-travail/${article.slug}`;

  return {
    title,
    description,
    keywords: [...article.tags, isAr ? "مدونة الشغل المغرب" : "code du travail maroc", isAr ? "قانون الشغل" : "droit du travail", "Loi 65-99"],
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "InteractJob",
      locale: isAr ? "ar_MA" : "fr_MA",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
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

  const enriched = enrichedById[article.id];
  const faq = isAr ? enriched?.faq_ar : enriched?.faq;

  // Prev / Next
  const currentIdx = ALL_SLUGS.indexOf(article.slug);
  const prevArticle = currentIdx > 0 ? frBySlug[ALL_SLUGS[currentIdx - 1]] : null;
  const nextArticle = currentIdx < ALL_SLUGS.length - 1 ? frBySlug[ALL_SLUGS[currentIdx + 1]] : null;

  // Related articles
  const relatedIds = enriched?.related ?? [];
  const relatedArticles = relatedIds
    .map((id) => articles.find((a) => a.id === id))
    .filter(Boolean) as Article[];
  const displayRelated = relatedArticles.length > 0
    ? relatedArticles
    : articles.filter((a) => a.id !== article.id && a.theme === article.theme).slice(0, 4);

  const isIndemnite = ["art-52", "art-53", "art-43", "art-44", "art-74"].includes(article.id);

  // ── JSON-LD ────────────────────────────────────────────────────────────────

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "InteractJob", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: isAr ? "مدونة الشغل" : "Code du travail", item: `${BASE_URL}/code-travail` },
      {
        "@type": "ListItem",
        position: 3,
        name: isAr ? `الفصل ${article.numero}` : `Article ${article.numero} — ${article.titre}`,
        item: `${BASE_URL}/code-travail/${article.slug}`,
      },
    ],
  };

  const legalDocJsonLd = {
    "@context": "https://schema.org",
    "@type": "LegalDocument",
    name: isAr
      ? `الفصل ${article.numero} — ${article.titre} — مدونة الشغل المغربية`
      : `Article ${article.numero} — ${article.titre} — Code du Travail Maroc`,
    description: article.resume,
    url: `${BASE_URL}/code-travail/${article.slug}`,
    jurisdiction: isAr ? "المغرب" : "Morocco",
    legislationIdentifier: "Loi n° 65-99",
    legislationType: isAr ? "قانون" : "Loi",
    inLanguage: isAr ? ["ar"] : ["fr", "en", "ar"],
    datePublished: "2004-09-11",
    dateModified: "2024-01-01",
    author: {
      "@type": "Person",
      name: "Adil Drouz",
      url: `${BASE_URL}/a-propos`,
    },
    publisher: {
      "@type": "Organization",
      name: "InteractJob",
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/InteractJob-Logo.png` },
    },
    isPartOf: {
      "@type": "LegalDocument",
      name: isAr ? "مدونة الشغل المغربية — القانون رقم 65.99" : "Code du travail marocain — Loi n° 65-99",
      url: `${BASE_URL}/code-travail`,
    },
    about: { "@type": "Thing", name: article.theme },
    keywords: article.tags.join(", "),
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/code-travail/${article.slug}` },
  };

  const faqJsonLd = faq && faq.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  } : null;

  const ui = {
    home: isAr ? "الرئيسية" : "Accueil",
    code: isAr ? "مدونة الشغل" : "Code du travail",
    articleLabel: isAr ? `الفصل ${article.numero}` : `Article ${article.numero}`,
    summary: isAr ? "ملخص" : "En résumé",
    official: isAr ? "النص الرسمي" : "Ce que dit la loi",
    concretementTitle: isAr ? "ما الذي يعنيه هذا فعلياً؟" : "Ce que ça veut dire concrètement",
    analyseTitle: isAr ? "التحليل القانوني" : "Analyse juridique",
    faqTitle: isAr ? "أسئلة شائعة" : "Questions fréquentes",
    keywords: isAr ? "الكلمات المفتاحية" : "Mots-clés associés",
    infoTitle: isAr ? "معلومات" : "Informations",
    number: isAr ? "رقم الفصل" : "Numéro",
    theme: isAr ? "الموضوع" : "Thème",
    book: isAr ? "الكتاب" : "Livre",
    law: isAr ? "القانون" : "Loi",
    country: isAr ? "البلد" : "Pays",
    morocco: isAr ? "المغرب" : "Maroc",
    updatedLabel: isAr ? "آخر تحديث" : "Mis à jour",
    updatedDate: isAr ? LAST_UPDATED_AR : LAST_UPDATED,
    ctaTitle: isAr ? "ابحث عن عمل" : "Chercher un emploi",
    ctaDesc: isAr ? "مئات العروض في المغرب" : "Des centaines d'offres au Maroc",
    ctaBtn: isAr ? "عرض العروض" : "Voir les offres",
    relatedTitle: isAr ? "مواد مرتبطة" : "Articles liés",
    allArticles: isAr ? "جميع الفصول ←" : "Tous les articles →",
    disclaimer: isAr ? "تنبيه قانوني" : "Avertissement juridique",
    disclaimerBody: isAr
      ? "هذه المعلومات للإرشاد فقط. لأي سؤال قانوني محدد، استشر محامياً متخصصاً في قانون الشغل أو مفتشية الشغل القريبة منك."
      : "Cet article est fourni à titre informatif uniquement. Pour toute question juridique, consultez un avocat spécialisé ou l'Inspection du travail.",
    prevLabel: isAr ? "الفصل السابق" : "Article précédent",
    nextLabel: isAr ? "الفصل التالي" : "Article suivant",
    printLabel: isAr ? "طباعة / تحميل PDF" : "Imprimer / Télécharger PDF",
    calculatorLink: isAr ? "حاسبة التعويضات ←" : "Calculateur d'indemnités →",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(legalDocJsonLd) }} />
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir={isAr ? "rtl" : "ltr"}>
        {/* Breadcrumb */}
        <nav className={`text-sm text-gray-500 mb-8 flex items-center gap-2 flex-wrap ${isAr ? "flex-row-reverse" : ""}`} aria-label="Fil d'Ariane">
          <Link href="/" className="hover:text-primary transition-colors">{ui.home}</Link>
          <span>/</span>
          <Link href={"/code-travail" as any} className="hover:text-primary transition-colors">{ui.code}</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{ui.articleLabel}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main content ─────────────────────────────────────────── */}
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
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ui.updatedLabel} : {ui.updatedDate} — Loi n° 65-99
                  </p>
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
              <div>
                <h2 className={`text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 ${isAr ? "text-right" : ""}`}>
                  {ui.official}
                </h2>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className={`text-sm text-gray-700 leading-relaxed italic ${isAr ? "text-right" : ""}`}>
                    &ldquo;{article.texte}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Concrètement section */}
            {enriched?.concretement && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className={`text-base font-bold text-gray-900 mb-3 flex items-center gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
                  <span className="w-7 h-7 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-sm flex-shrink-0">💡</span>
                  {ui.concretementTitle}
                </h2>
                <p className={`text-sm text-gray-700 leading-relaxed ${isAr ? "text-right" : ""}`}>
                  {enriched.concretement}
                </p>
                {isIndemnite && !isAr && (
                  <Link
                    href={"/code-travail" as any}
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    🧮 {ui.calculatorLink}
                  </Link>
                )}
              </div>
            )}

            {/* Analyse juridique */}
            {enriched?.analyse && !isAr && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center text-sm flex-shrink-0">⚖️</span>
                  {ui.analyseTitle}
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">{enriched.analyse}</p>
              </div>
            )}

            {/* FAQ Accordion */}
            {faq && faq.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className={`text-base font-bold text-gray-900 mb-4 flex items-center gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
                  <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-sm flex-shrink-0">❓</span>
                  {ui.faqTitle}
                </h2>
                <FaqAccordion items={faq} isAr={isAr} />
              </div>
            )}

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className={`text-sm font-bold text-gray-700 mb-3 ${isAr ? "text-right" : ""}`}>
                {ui.keywords}
              </h2>
              <div className={`flex flex-wrap gap-2 ${isAr ? "justify-end" : ""}`}>
                {article.tags.map((tag) => (
                  <span key={tag} className="text-sm text-primary bg-primary-light px-3 py-1 rounded-full border border-primary/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Print button */}
            <div className={`flex ${isAr ? "justify-end" : "justify-start"}`}>
              <PrintButton label={ui.printLabel} />
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
            <div className={`flex items-center justify-between gap-4 pt-2 ${isAr ? "flex-row-reverse" : ""}`}>
              {prevArticle ? (
                <Link
                  href={`/code-travail/${prevArticle.slug}` as any}
                  className="group flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  {!isAr && <span className="text-gray-400 group-hover:text-primary">←</span>}
                  <span>
                    <span className="block text-xs text-gray-400">{ui.prevLabel}</span>
                    <span className="font-medium">Art. {prevArticle.numero}</span>
                  </span>
                  {isAr && <span className="text-gray-400 group-hover:text-primary">→</span>}
                </Link>
              ) : <div />}
              {nextArticle ? (
                <Link
                  href={`/code-travail/${nextArticle.slug}` as any}
                  className={`group flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors ${isAr ? "" : "text-right"}`}
                >
                  <span>
                    <span className="block text-xs text-gray-400">{ui.nextLabel}</span>
                    <span className="font-medium">Art. {nextArticle.numero}</span>
                  </span>
                  {!isAr && <span className="text-gray-400 group-hover:text-primary">→</span>}
                  {isAr && <span className="text-gray-400 group-hover:text-primary">←</span>}
                </Link>
              ) : <div />}
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
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
                  { label: ui.updatedLabel, value: ui.updatedDate },
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
              <Link href="/offres" className="block bg-white text-primary font-bold py-2 rounded-xl text-sm hover:bg-blue-50 transition-colors">
                {ui.ctaBtn}
              </Link>
            </div>

            {/* Related articles */}
            {displayRelated.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className={`font-bold text-gray-900 text-sm mb-4 ${isAr ? "text-right" : ""}`}>
                  {ui.relatedTitle}
                </h3>
                <div className="space-y-3">
                  {displayRelated.map((rel) => (
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

      <style>{`
        @media print {
          nav, aside, .print\\:hidden, button { display: none !important; }
          body { font-size: 12pt; }
          .shadow-sm { box-shadow: none !important; }
        }
      `}</style>
    </>
  );
}
