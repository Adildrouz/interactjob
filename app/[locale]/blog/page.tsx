import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import articlesData from "@/data/articles.json";
import { buildAlternates } from "@/lib/hreflang";

export const revalidate = 3600;

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryColor: string;
  coverEmoji: string;
  heroImage?: string;
  heroAlt?: string;
  author: string;
  publishedAt: string;
  readTime: number;
  excerpt: string;
  lang?: string;
};

const CATEGORIES_FR = ["Tous", "CV & Candidature", "Recrutement", "Carrière", "Juridique & RH", "Innovation RH", "Entretien", "Personal Branding", "Marché de l'emploi"];
const CATEGORIES_AR = ["الكل", "السيرة الذاتية والترشيح", "التوظيف", "المسيرة المهنية", "القانوني والموارد البشرية", "ابتكار الموارد البشرية", "المقابلة", "العلامة الشخصية", "سوق العمل"];
const CATEGORIES_EN = ["All", "CV & Application", "Recruitment", "Career", "Legal & HR", "HR Innovation", "Interview", "Personal Branding", "Job Market"];

function getCategories(locale: string) {
  if (locale === "ar") return CATEGORIES_AR;
  if (locale === "en") return CATEGORIES_EN;
  return CATEGORIES_FR;
}

function getArticlesForLocale(locale: string): Article[] {
  const all = articlesData as Article[];
  const localeArticles = all.filter((a) => (a.lang ?? "fr") === locale);
  // fallback to French if no articles in current locale yet
  if (localeArticles.length === 0) return all.filter((a) => (a.lang ?? "fr") === "fr");
  return localeArticles;
}

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(
    locale === "ar" ? "ar-MA" : locale === "en" ? "en-GB" : "fr-FR",
    { day: "numeric", month: "long", year: "numeric" }
  );
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "مدونة الموارد البشرية – نصائح مهنية | InteractJob"
      : "Blog RH – Conseils carrière & emploi au Maroc | InteractJob",
    description: isAr
      ? "نصائح خبراء السيرة الذاتية والمقابلات والرواتب وسوق العمل المغربي."
      : "Conseils CV, entretiens, salaires, ATS, LinkedIn et marché de l'emploi marocain.",
    alternates: buildAlternates("/blog"),
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const t = await getTranslations("blog");

  const articles = getArticlesForLocale(locale);
  const categories = getCategories(locale);

  const featured = articles[0];
  const rest = articles.filter((a) => a.id !== featured?.id);

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-5 border border-white/20">
            📚 {t("headerBadge")}
          </div>
          <h1 className="text-4xl font-bold">{t("headerTitle")}</h1>
          <p className="mt-4 text-gray-300 max-w-xl mx-auto">{t("headerDesc")}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories */}
        <div className={`flex flex-wrap gap-2 mb-10 ${isAr ? "flex-row-reverse" : ""}`}>
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                i === 0
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured article */}
        {featured && (
          <div className="mb-10">
            <Link href={`/blog/${featured.slug}`} className="group block">
              <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white relative overflow-hidden hover:shadow-xl transition-shadow">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }}
                />
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className={isAr ? "text-right" : ""}>
                    <div className={`flex items-center gap-3 mb-4 ${isAr ? "flex-row-reverse" : ""}`}>
                      <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                        {t("featuredTag")}
                      </span>
                      <span className="text-blue-200 text-xs">{featured.category}</span>
                    </div>
                    <h2 className="text-2xl font-bold group-hover:text-accent transition-colors leading-snug">
                      {featured.title}
                    </h2>
                    <p className="mt-3 text-blue-100 text-sm leading-relaxed line-clamp-3">
                      {featured.excerpt}
                    </p>
                    <div className={`mt-5 flex items-center gap-4 text-sm text-blue-200 ${isAr ? "flex-row-reverse" : ""}`}>
                      <span>{formatDate(featured.publishedAt, locale)}</span>
                      <span>·</span>
                      <span>{featured.readTime} {t("readMin")}</span>
                    </div>
                    <div className={`mt-5 inline-flex items-center gap-2 bg-white text-primary font-semibold px-5 py-2.5 rounded-xl text-sm group-hover:bg-accent group-hover:text-white transition-colors`}>
                      {t("readArticle")}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center">
                    {featured.heroImage ? (
                      <div className="relative w-full h-52 rounded-xl overflow-hidden">
                        <Image
                          src={featured.heroImage}
                          alt={featured.heroAlt || featured.title}
                          fill
                          className="object-cover opacity-90"
                          sizes="400px"
                        />
                      </div>
                    ) : (
                      <div className="text-[120px] leading-none select-none opacity-80">
                        {featured.coverEmoji}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Articles grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((article) => (
            <Link key={article.id} href={`/blog/${article.slug}`} className="group">
              <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col">
                {article.heroImage ? (
                  <div className="relative w-full h-44 overflow-hidden border-b border-gray-100">
                    <Image
                      src={article.heroImage}
                      alt={article.heroAlt || article.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center border-b border-gray-100">
                    <span className="text-6xl">{article.coverEmoji}</span>
                  </div>
                )}
                <div className={`p-5 flex flex-col flex-1 ${isAr ? "text-right" : ""}`}>
                  <div className={`flex items-center gap-2 mb-3 ${isAr ? "flex-row-reverse" : ""}`}>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${article.categoryColor}`}>
                      {article.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors leading-snug line-clamp-2 text-base">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed flex-1">
                    {article.excerpt}
                  </p>
                  <div className={`mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400 ${isAr ? "flex-row-reverse" : ""}`}>
                    <span>{formatDate(article.publishedAt, locale)}</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {article.readTime} min
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* LinkedIn CTA */}
        <div className={`mt-16 bg-blue-50 border border-blue-100 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 ${isAr ? "sm:flex-row-reverse text-right" : ""}`}>
          <div className={`flex items-center gap-4 ${isAr ? "flex-row-reverse" : ""}`}>
            <div className="w-12 h-12 bg-[#0077B5] rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-gray-900">{t("linkedinSub")}</p>
            </div>
          </div>
          <a
            href="https://www.linkedin.com/company/interact-job/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-[#0077B5] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#006097] transition-colors"
          >
            {t("linkedinFollow")}
          </a>
        </div>
      </div>
    </div>
  );
}
