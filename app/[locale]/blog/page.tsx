import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import articles from "@/data/articles.json";

export const metadata: Metadata = {
  title: "Blog RH – Conseils carrière & emploi au Maroc | InteractJob",
  description: "Conseils CV, entretiens, salaires, ATS, LinkedIn et marché de l'emploi marocain. Toute l'expertise RH d'InteractJob.",
};

const categories = ["Tous", "CV & Candidature", "Recrutement", "Carrière", "Innovation RH", "Entretien", "Personal Branding", "Marché de l'emploi"];

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPage() {
  const t = await getTranslations("blog");
  const featured = articles[1];
  const rest = articles.filter((a) => a.id !== featured.id);

  return (
    <>
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
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                cat === "Tous"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured article */}
        <div className="mb-10">
          <Link href={`/blog/${featured.slug}`} className="group block">
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white relative overflow-hidden hover:shadow-xl transition-shadow">
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }}
              />
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
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
                  <div className="mt-5 flex items-center gap-4 text-sm text-blue-200">
                    <span>{timeAgo(featured.publishedAt)}</span>
                    <span>·</span>
                    <span>{featured.readTime} {t("readMin")}</span>
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 bg-white text-primary font-semibold px-5 py-2.5 rounded-xl text-sm group-hover:bg-accent group-hover:text-white transition-colors">
                    {t("readArticle")}
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-center">
                  <div className="text-[120px] leading-none select-none opacity-80">
                    {featured.coverEmoji}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((article) => (
            <Link key={article.id} href={`/blog/${article.slug}`} className="group">
              <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden h-full flex flex-col">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center border-b border-gray-100">
                  <span className="text-6xl">{article.coverEmoji}</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
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
                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>{timeAgo(article.publishedAt)}</span>
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
        <div className="mt-16 bg-blue-50 border border-blue-100 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
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
    </>
  );
}
