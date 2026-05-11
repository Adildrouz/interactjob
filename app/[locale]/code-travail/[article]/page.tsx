import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import codeTravail from "@/data/code-travail.json";

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

const ALL_ARTICLES = codeTravail as Article[];

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    ALL_ARTICLES.map((a) => ({ locale, article: a.slug }))
  );
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; article: string }> }
): Promise<Metadata> {
  const { article: slug } = await params;
  const article = ALL_ARTICLES.find((a) => a.slug === slug);
  if (!article) return {};

  const title = `Article ${article.numero} – ${article.titre} | Code du travail Maroc`;
  const description = article.resume;
  const canonical = `${BASE_URL}/code-travail/${article.slug}`;

  return {
    title,
    description,
    keywords: [...article.tags, "code du travail maroc", "droit du travail", `article ${article.numero}`],
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "InteractJob",
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

const THEME_ICONS: Record<string, string> = {
  "Dispositions générales": "📋",
  "Droits fondamentaux": "⚖️",
  "Contrat de travail": "📄",
  "Période d'essai": "🔍",
  "Licenciement": "🚪",
  "Préavis & Indemnités": "💰",
  "Durée du travail": "⏰",
  "Congés & Repos": "🏖️",
  "Salaire & SMIG": "💵",
  "Maternité & Famille": "👶",
  "Hygiène & Sécurité": "🦺",
  "Syndicats": "🤝",
  "Délégués du personnel": "👥",
  "Relations collectives": "📢",
  "Apprentissage & Formation": "🎓",
  "Travail des femmes": "👩‍💼",
  "Travail des jeunes": "🧑",
  "Inspection du travail": "🔎",
  "Dispositions pénales": "⚠️",
};

export default async function ArticleCodeTravailPage({
  params,
}: {
  params: Promise<{ locale: string; article: string }>;
}) {
  const { article: slug } = await params;
  const article = ALL_ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  const related = ALL_ARTICLES
    .filter((a) => a.id !== article.id && a.theme === article.theme)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Article ${article.numero} – ${article.titre}`,
    description: article.resume,
    url: `${BASE_URL}/code-travail/${article.slug}`,
    publisher: {
      "@type": "Organization",
      name: "InteractJob",
      url: BASE_URL,
    },
    about: {
      "@type": "Legislation",
      name: `Article ${article.numero} du Code du travail marocain`,
      legislationType: "Loi",
      jurisdiction: "Maroc",
    },
    keywords: article.tags.join(", "),
    inLanguage: "fr-MA",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-8 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <span>/</span>
          <Link href={"/code-travail" as any} className="hover:text-primary transition-colors">
            Code du travail
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Article {article.numero}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Article header */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center font-extrabold text-lg flex-shrink-0">
                  {article.numero}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {THEME_ICONS[article.theme] || "📋"} {article.theme}
                    </span>
                    <span className="text-xs text-gray-400">{article.livre}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                    Article {article.numero} – {article.titre}
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">{article.chapitre}</p>
                </div>
              </div>

              {/* Resume */}
              <div className="bg-primary-light border border-primary/20 rounded-xl p-4 mb-5">
                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wide">En résumé</p>
                <p className="text-sm text-gray-700 leading-relaxed">{article.resume}</p>
              </div>

              {/* Full article text */}
              <div>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                  Texte officiel
                </h2>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed italic">
                    &ldquo;{article.texte}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3">Mots-clés associés</h2>
              <div className="flex flex-wrap gap-2">
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

            {/* Legal disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="font-bold text-amber-900 text-sm">Avertissement juridique</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Cet article est fourni à titre informatif uniquement. Pour toute question juridique,
                  consultez un avocat spécialisé ou l'Inspection du travail. Le texte peut avoir été
                  modifié par des dispositions ultérieures.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-4">Informations</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  { label: "Numéro", value: `Article ${article.numero}` },
                  { label: "Thème", value: article.theme },
                  { label: "Livre", value: article.livre },
                  { label: "Loi", value: "n° 65-99" },
                  { label: "Pays", value: "Maroc" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400">{label}</span>
                    <span className="font-semibold text-gray-800 text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-primary rounded-2xl p-5 text-white text-center">
              <p className="text-lg mb-1">🔍</p>
              <p className="font-bold text-sm mb-1">Chercher un emploi</p>
              <p className="text-xs text-blue-100 mb-3">Des centaines d'offres au Maroc</p>
              <Link
                href="/offres"
                className="block bg-white text-primary font-bold py-2 rounded-xl text-sm hover:bg-blue-50 transition-colors"
              >
                Voir les offres
              </Link>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-4">Articles du même thème</h3>
                <div className="space-y-3">
                  {related.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/code-travail/${rel.slug}` as any}
                      className="group flex items-start gap-3"
                    >
                      <span className="w-9 h-9 bg-primary-light text-primary rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        {rel.numero}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {rel.titre}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href={"/code-travail" as any}
                  className="block text-center text-xs text-primary font-medium mt-4 hover:underline"
                >
                  Tous les articles →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
