"use client";
import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { useLocale } from "next-intl";
import articlesFr from "@/data/code-travail.json";
import articlesAr from "@/data/code-travail-ar.json";

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

const THEMES_FR = [
  "Tous",
  "Dispositions générales",
  "Droits fondamentaux",
  "Contrat de travail",
  "Période d'essai",
  "Licenciement",
  "Préavis & Indemnités",
  "Durée du travail",
  "Congés & Repos",
  "Salaire & SMIG",
  "Maternité & Famille",
  "Hygiène & Sécurité",
  "Syndicats",
  "Délégués du personnel",
  "Relations collectives",
  "Apprentissage & Formation",
  "Travail des femmes",
  "Travail des jeunes",
  "Inspection du travail",
  "Dispositions pénales",
];

const THEMES_AR = [
  "الكل",
  "أحكام عامة",
  "الحقوق الأساسية",
  "عقد الشغل",
  "فترة التجربة",
  "الفصل من العمل",
  "الإخطار المسبق والتعويضات",
  "مدة الشغل",
  "العطل والراحة",
  "الأجر والحد الأدنى",
  "الأمومة والأسرة",
  "النظافة والسلامة",
  "النقابات المهنية",
  "مندوبو الأجراء",
  "العلاقات الجماعية",
  "التمهين والتكوين",
  "شغل المرأة",
  "شغل الأحداث",
  "تفتيش الشغل",
  "أحكام جنائية",
];

const THEME_ICONS: Record<string, string> = {
  // French
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
  // Arabic
  "أحكام عامة": "📋",
  "الحقوق الأساسية": "⚖️",
  "عقد الشغل": "📄",
  "فترة التجربة": "🔍",
  "الفصل من العمل": "🚪",
  "الإخطار المسبق والتعويضات": "💰",
  "مدة الشغل": "⏰",
  "العطل والراحة": "🏖️",
  "الأجر والحد الأدنى": "💵",
  "الأمومة والأسرة": "👶",
  "النظافة والسلامة": "🦺",
  "النقابات المهنية": "🤝",
  "مندوبو الأجراء": "👥",
  "العلاقات الجماعية": "📢",
  "التمهين والتكوين": "🎓",
  "شغل المرأة": "👩‍💼",
  "شغل الأحداث": "🧑",
  "تفتيش الشغل": "🔎",
  "أحكام جنائية": "⚠️",
};

export default function CodeTravailPage() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const ALL_ARTICLES = (isAr ? articlesAr : articlesFr) as Article[];
  const THEMES = isAr ? THEMES_AR : THEMES_FR;
  const allLabel = isAr ? "الكل" : "Tous";
  const searchPlaceholder = isAr
    ? "ابحث برقم الفصل أو كلمة مفتاحية (مثال: فصل، SMIG، إخطار)..."
    : "Rechercher par numéro d'article, mot-clé (ex: licenciement, SMIG, préavis)...";
  const resetLabel = isAr ? "إعادة تعيين البحث" : "Réinitialiser la recherche";
  const noResultTitle = isAr ? "لا توجد نتائج" : "Aucun article trouvé";
  const noResultDesc = isAr ? "جرب مصطلحاً آخر أو غير الموضوع" : "Essayez un autre terme ou changez de thème";
  const disclaimerTitle = isAr ? "تنبيه قانوني" : "Avertissement juridique";
  const disclaimerBody = isAr
    ? "هذه المعلومات للإرشاد فقط. لأي سؤال قانوني محدد، استشر محامياً متخصصاً في قانون الشغل أو مفتشية الشغل القريبة منك. قد تكون مدونة الشغل قد عُدِّلت بنصوص لاحقة."
    : "Ces articles sont fournis à titre informatif uniquement. Pour toute question juridique spécifique, consultez un avocat spécialisé en droit du travail ou l'Inspection du travail la plus proche. Le Code du travail peut avoir été modifié par des textes ultérieurs.";

  const [search, setSearch] = useState("");
  const [activeTheme, setActiveTheme] = useState(allLabel);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ALL_ARTICLES.filter((a) => {
      const matchTheme = activeTheme === allLabel || a.theme === activeTheme;
      if (!q) return matchTheme;
      const matchSearch =
        a.numero.includes(q) ||
        a.titre.toLowerCase().includes(q) ||
        a.resume.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q));
      return matchTheme && matchSearch;
    });
  }, [search, activeTheme, ALL_ARTICLES, allLabel]);

  const resultsText = isAr
    ? `${filtered.length} فصل${filtered.length !== 1 ? "" : ""} ${activeTheme !== allLabel ? `في "${activeTheme}"` : ""} ${search ? `لـ "${search}"` : ""}`
    : `${filtered.length} article${filtered.length !== 1 ? "s" : ""} trouvé${filtered.length !== 1 ? "s" : ""} ${activeTheme !== allLabel ? `dans "${activeTheme}"` : ""} ${search ? `pour "${search}"` : ""}`;

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-5 border border-white/20">
            ⚖️ {isAr ? "قانون الشغل المغربي" : "Droit du travail marocain"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            {isAr ? "مدونة الشغل المغربية" : "Code du travail marocain"}
          </h1>
          <p className="text-gray-300 max-w-2xl leading-relaxed">
            {isAr
              ? "اطلع على الفصول الأساسية من مدونة الشغل المغربية (القانون رقم 65.99). ابحث بالفصل أو الموضوع أو الكلمة المفتاحية."
              : "Consultez les articles clés du Code du travail du Maroc (Loi n° 65-99). Recherchez par article, thème ou mot-clé."}
          </p>
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-400 flex-wrap">
            <span className="bg-white/10 px-3 py-1 rounded-full">{ALL_ARTICLES.length} {isAr ? "فصل" : "articles"}</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">{isAr ? "القانون رقم 65.99" : "Loi n° 65-99"}</span>
            <span className="bg-white/10 px-3 py-1 rounded-full">{isAr ? "محيَّن 2024" : "Mise à jour 2024"}</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search bar */}
        <div className="relative mb-8">
          <svg
            className={`absolute ${isAr ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className={`w-full ${isAr ? "pr-12 pl-4 text-right" : "pl-12 pr-4"} py-3.5 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className={`absolute ${isAr ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Theme filters */}
        <div className={`flex flex-wrap gap-2 mb-8 ${isAr ? "flex-row-reverse" : ""}`}>
          {THEMES.map((theme) => (
            <button
              key={theme}
              onClick={() => setActiveTheme(theme)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeTheme === theme
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
              }`}
            >
              {theme !== allLabel && THEME_ICONS[theme] ? `${THEME_ICONS[theme]} ` : ""}
              {theme}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className={`text-sm text-gray-500 mb-5 ${isAr ? "text-right" : ""}`}>
          {resultsText}
        </p>

        {/* Articles grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-semibold text-gray-700 text-lg">{noResultTitle}</p>
            <p className="text-sm mt-1">{noResultDesc}</p>
            <button
              onClick={() => { setSearch(""); setActiveTheme(allLabel); }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              {resetLabel}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((article) => (
              <Link
                key={article.id}
                href={`/code-travail/${article.slug}` as any}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 p-5 flex flex-col"
              >
                <div className={`flex items-start justify-between gap-3 mb-3 ${isAr ? "flex-row-reverse" : ""}`}>
                  <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0">
                    {isAr ? `الفصل ${article.numero}` : `Art. ${article.numero}`}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 text-right">
                    {THEME_ICONS[article.theme] || "📋"} {article.theme}
                  </span>
                </div>

                <h3 className={`font-bold text-gray-900 group-hover:text-primary transition-colors text-sm leading-snug mb-2 ${isAr ? "text-right" : ""}`}>
                  {article.titre}
                </h3>

                <p className={`text-xs text-gray-500 leading-relaxed flex-1 line-clamp-3 ${isAr ? "text-right" : ""}`}>
                  {article.resume}
                </p>

                <div className={`mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-1.5 ${isAr ? "justify-end" : ""}`}>
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-primary bg-primary-light px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className={`mt-12 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 ${isAr ? "flex-row-reverse text-right" : ""}`}>
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <p className="font-bold text-amber-900 text-sm">{disclaimerTitle}</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">{disclaimerBody}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
