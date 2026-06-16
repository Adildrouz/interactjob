import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import articles from "@/data/articles.json";

const BASE_URL = "https://www.interactjob.ma";

// Allow new articles added by the agent to be served dynamically without a full rebuild
export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    articles.map((a) => ({ locale, slug: a.slug }))
  );
}

// Count words of an article's rendered body so we can keep thin pages out of
// Google's index (thin indexed pages trigger AdSense "low value content").
function articleWordCount(article: { content?: unknown; content_md?: string }): number {
  const strip = (s: string) =>
    s.replace(/<[^>]+>/g, " ").replace(/[#*[\]()>_`~-]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  const sections = Array.isArray(article.content) ? (article.content as Array<{ body?: string; html?: string }>) : [];
  let n = sections.reduce((acc, s) => acc + strip(s.body || s.html || ""), 0);
  if (n < 20 && article.content_md) n = strip(article.content_md);
  return n;
}

const MIN_INDEXABLE_WORDS = 350;

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> }
): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return {};

  const title = `${article.title} | Blog RH InteractJob`;
  // FR + substantial → index. Non-FR or thin article → noindex (keep it crawlable/follow).
  const indexable = locale === "fr" && articleWordCount(article) >= MIN_INDEXABLE_WORDS;
  return {
    title,
    description: article.excerpt,
    keywords: [article.category, "emploi maroc", "conseil carrière", "recrutement maroc", article.title],
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description: article.excerpt,
      url: `${BASE_URL}/blog/${article.slug}`,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author],
    },
    alternates: { canonical: `${BASE_URL}/blog/${article.slug}` },
  };
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(
    locale === "ar" ? "ar-MA" : locale === "en" ? "en-GB" : "fr-FR",
    { day: "numeric", month: "long", year: "numeric" }
  );
}

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const isAr = locale === "ar";
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const t = await getTranslations("article");

  const AUTHOR = {
    "@type": "Person",
    "@id": `${BASE_URL}/#author-adil-drouz`,
    name: "Adil Drouz",
    jobTitle: "Expert RH & Recrutement",
    url: `${BASE_URL}/a-propos`,
    sameAs: ["https://www.linkedin.com/in/adil-drouz/"],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    author: AUTHOR,
    publisher: {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "InteractJob",
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/InteractJob-Logo.png` },
    },
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    url: `${BASE_URL}/blog/${article.slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/blog/${article.slug}` },
    articleSection: article.category,
    inLanguage: isAr ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Blog RH", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${BASE_URL}/blog/${article.slug}` },
    ],
  };

  const related = articles.filter((a) => a.id !== article.id && a.category === article.category).slice(0, 3);
  const others = related.length < 2 ? articles.filter((a) => a.id !== article.id).slice(0, 3) : related;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir={isAr ? "rtl" : "ltr"}>
        {/* Breadcrumb */}
        <nav className={`text-sm text-gray-500 mb-8 flex items-center gap-2 flex-wrap ${isAr ? "flex-row-reverse" : ""}`}>
          <Link href="/" className="hover:text-primary transition-colors">{t("home")}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary transition-colors">{t("blog")}</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{article.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Article main */}
          <article className="lg:col-span-2">
            <div className={`mb-8 ${isAr ? "text-right" : ""}`}>
              <div className={`flex items-center gap-3 mb-4 ${isAr ? "flex-row-reverse" : ""}`}>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${article.categoryColor}`}>
                  {article.category}
                </span>
                <span className="text-gray-400 text-sm">{article.readTime} {t("readMin")}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                {article.title}
              </h1>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">{article.excerpt}</p>
              <div className={`mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-400 ${isAr ? "flex-row-reverse" : ""}`}>
                <span className={`flex items-center gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">AD</div>
                  <span>Adil Drouz</span>
                </span>
                <span>·</span>
                <span>{formatDate(article.publishedAt, locale)}</span>
              </div>
            </div>

            {(article as any).heroImage ? (
              <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden mb-10 border border-gray-100">
                <Image
                  src={(article as any).heroImage}
                  alt={(article as any).heroAlt || article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              </div>
            ) : (
              <div className="bg-gradient-to-br from-primary-light to-accent-light rounded-2xl p-12 text-center mb-10 border border-gray-100">
                <span className="text-8xl">{article.coverEmoji}</span>
              </div>
            )}

            <div className="space-y-8">
              {article.content.map((section, i) => (
                <section key={i} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-7 ${isAr ? "text-right" : ""}`}>
                  <h2 className={`text-xl font-bold text-gray-900 mb-4 flex items-start gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
                    <span className="w-7 h-7 bg-primary text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {section.heading}
                  </h2>
                  {(section as any).html
                    ? <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none prose-table:w-full prose-td:py-2 prose-th:py-2" dangerouslySetInnerHTML={{ __html: (section as any).html }} />
                    : <p className="text-gray-600 leading-relaxed">{section.body}</p>
                  }
                </section>
              ))}
            </div>

            {/* Internal links */}
            {(article as any).internalLinks?.length > 0 && (
              <div className="mt-8 bg-blue-50 rounded-2xl border border-blue-100 p-6">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Articles liés</h3>
                <ul className="space-y-2">
                  {(article as any).internalLinks.map((link: { href: string; title: string }, i: number) => (
                    <li key={i}>
                      <Link
                        href={link.href as any}
                        className="text-sm text-primary hover:underline flex items-start gap-2"
                      >
                        <span className="text-accent mt-0.5 flex-shrink-0">›</span>
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Share bar */}
            <div className="mt-10 bg-gray-50 rounded-2xl border border-gray-100 p-6">
              <p className="font-semibold text-gray-800 mb-3 text-sm">{t("shareTitle")}</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${BASE_URL}/blog/${article.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-[#0077B5] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#006097] transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  {t("shareLinkedin")}
                </a>
                <Link
                  href="/blog"
                  className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {t("backToBlog")}
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Author card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">AD</div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Adil Drouz</p>
                  <p className="text-xs text-gray-500">Expert RH &amp; Recrutement · 8 ans</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">{t("authorDesc")}</p>
              <a
                href="https://www.linkedin.com/in/adil-drouz/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center text-sm font-medium text-[#0077B5] bg-blue-50 hover:bg-blue-100 py-2 rounded-lg transition-colors"
              >
                {t("followLinkedin")}
              </a>
            </div>

            {/* External authority link */}
            {(article as any).externalLink && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-2 text-sm">Source de référence</h3>
                <a
                  href={(article as any).externalLink.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group"
                >
                  <span className="text-accent text-lg flex-shrink-0">↗</span>
                  <div>
                    <p className="text-sm text-gray-700 group-hover:text-primary transition-colors leading-snug">
                      {(article as any).externalLink.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{(article as any).externalLink.authority}</p>
                  </div>
                </a>
              </div>
            )}

            {/* Related articles */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">{t("similarTitle")}</h3>
              <div className="space-y-4">
                {others.map((a) => (
                  <Link key={a.id} href={`/blog/${a.slug}`} className="group flex gap-3 items-start">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:bg-primary-light transition-colors">
                      {a.coverEmoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {a.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{a.readTime} {t("readMin")}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* CTA post job */}
            <div className="bg-gradient-to-br from-accent to-accent-dark rounded-2xl p-5 text-white text-center">
              <p className="text-2xl mb-2">🏢</p>
              <p className="font-bold">{t("recruiterTitle")}</p>
              <p className="text-sm text-green-100 mt-1">{t("recruiterDesc")}</p>
              <Link
                href="/publier"
                className="mt-4 block bg-white text-accent font-bold py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors"
              >
                {t("recruiterCta")}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
