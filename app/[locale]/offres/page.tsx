"use client";
import { useState, useMemo, Suspense, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import JobCard from "@/components/JobCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import jobs from "@/data/jobs.json";
import { Job, JobLocalisation, JobNiveau } from "@/types";

const allJobs = jobs as unknown as Job[];

const sectors = ["IT", "Finance", "Hôtellerie", "RH", "Administratif", "Commerce", "Marketing", "Industrie", "Santé", "BTP", "Logistique", "Éducation"];
const SECTORS_AR: Record<string, string> = {
  "IT": "تقنية المعلومات", "Finance": "المالية", "Hôtellerie": "الفندقة",
  "RH": "الموارد البشرية", "Administratif": "الإداري", "Commerce": "التجارة",
  "Marketing": "التسويق", "Industrie": "الصناعة", "Santé": "الصحة",
  "BTP": "البناء", "Logistique": "اللوجستيك", "Éducation": "التعليم",
};
const contractTypes: Job["contractType"][] = ["CDI", "CDD", "Stage"];
const cities = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Agadir",
  "Tanger", "Meknès", "Khouribga", "Oujda", "Tétouan", "Essaouira",
];
const sources: Job["source"][] = ["Rekrute.com", "Emploi.ma", "Bayt.com", "Direct"];
const sortOptions = [
  { value: "recent", label: "Offres récentes", labelAr: "الأحدث" },
  { value: "oldest", label: "Offres anciennes", labelAr: "الأقدم" },
  { value: "sponsored", label: "Offres sponsorisées", labelAr: "العروض المميزة" },
];

const LOCALISATION_OPTIONS: { value: JobLocalisation | ""; label: string; icon: string }[] = [
  { value: "",             label: "Toutes",                  icon: "🌍" },
  { value: "full-remote",  label: "Full Remote",             icon: "🏠" },
  { value: "remote-maroc", label: "Remote Maroc",            icon: "🇲🇦" },
  { value: "remote-uk-eu", label: "Remote UK / Europe",      icon: "🇪🇺" },
  { value: "hybride",      label: "Hybride",                 icon: "🔄" },
  { value: "presentiel",   label: "Sur site / Présentiel",   icon: "🏢" },
];

const NIVEAU_OPTIONS: { value: JobNiveau | ""; label: string }[] = [
  { value: "",             label: "Tous niveaux"         },
  { value: "stage",        label: "Fin d'études / Stage" },
  { value: "early-pro",    label: "Early Pro (0–1 an)"   },
  { value: "junior",       label: "Junior (1–2 ans)"     },
  { value: "intermediaire",label: "Intermédiaire (2–5 ans)" },
  { value: "senior",       label: "Senior (5+ ans)"      },
];

function OffresContent() {
  const t = useTranslations("offres");
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [keyword, setKeyword]           = useState(searchParams.get("keyword") ?? "");
  const [city, setCity]                 = useState(searchParams.get("city") ?? "");
  const [sector, setSector]             = useState(searchParams.get("sector") ?? "");
  const [contractType, setContractType] = useState<string>(searchParams.get("contract") ?? "");
  const [source, setSource]             = useState(searchParams.get("source") ?? "");
  const [localisation, setLocalisation] = useState<JobLocalisation | "">(
    (searchParams.get("localisation") as JobLocalisation) ?? ""
  );
  const [niveau, setNiveau]             = useState<JobNiveau | "">(
    (searchParams.get("niveau") as JobNiveau) ?? ""
  );
  const [sortBy, setSortBy]             = useState<string>("recent");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL → state when URL changes (back/forward navigation)
  useEffect(() => {
    setKeyword(searchParams.get("keyword") ?? "");
    setCity(searchParams.get("city") ?? "");
    setSector(searchParams.get("sector") ?? "");
    setContractType(searchParams.get("contract") ?? "");
    setSource(searchParams.get("source") ?? "");
    setLocalisation((searchParams.get("localisation") as JobLocalisation) ?? "");
    setNiveau((searchParams.get("niveau") as JobNiveau) ?? "");
  }, [searchParams]);

  // Sync state → URL (debounced via useEffect)
  const updateURL = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    const values: Record<string, string> = {
      keyword, city, sector, contract: contractType,
      source, localisation, niveau, ...overrides,
    };
    Object.entries(values).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [keyword, city, sector, contractType, source, localisation, niveau, pathname, router]);

  // Filtered + sorted jobs
  const filteredJobs = useMemo(() => {
    const kw = keyword.toLowerCase();
    return allJobs
      .filter((job) => {
        if (kw && !job.title.toLowerCase().includes(kw) && !job.company.toLowerCase().includes(kw)) return false;
        if (city && job.city !== city) return false;
        if (sector && job.sector !== sector) return false;
        if (contractType && job.contractType !== contractType) return false;
        if (source && job.source !== source) return false;
        if (localisation && (job as any).localisation !== localisation) return false;
        if (niveau && (job as any).niveau !== niveau) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "sponsored") {
          if (a.sponsored && !b.sponsored) return -1;
          if (!a.sponsored && b.sponsored) return 1;
          return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
        }
        if (sortBy === "oldest") return new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime();
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
  }, [keyword, city, sector, contractType, source, localisation, niveau, sortBy]);

  const hasFilters = !!(keyword || city || sector || contractType || source || localisation || niveau);

  function resetFilters() {
    setKeyword(""); setCity(""); setSector(""); setContractType("");
    setSource(""); setLocalisation(""); setNiveau("");
    router.replace(pathname, { scroll: false });
  }

  // Pill button helper (shared style)
  function PillButton({ value, active, onClick, children }: {
    value: string; active: boolean; onClick: () => void; children: React.ReactNode;
  }) {
    return (
      <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
          active
            ? "bg-primary text-white border-primary shadow-sm"
            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
        }`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir={isAr ? "rtl" : "ltr"}>
      <div className={`mb-8 ${isAr ? "text-right" : ""}`}>
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-500 mt-1">
          {filteredJobs.length} {t("resultsCount")}
        </p>
      </div>

      {/* Recently viewed jobs (localStorage, client-side) */}
      <RecentlyViewed />

      {/* Mobile toolbar */}
      <div className={`lg:hidden flex gap-3 mb-6 ${isAr ? "flex-row-reverse" : ""}`}>
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg hover:border-primary hover:text-primary transition-colors font-medium text-sm flex-1 ${
            hasFilters ? "border-primary text-primary" : "border-gray-200"
          } ${isAr ? "flex-row-reverse" : ""}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {mobileFiltersOpen ? "Masquer" : hasFilters ? `Filtres (actifs)` : "Filtrer"}
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm font-medium"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {isAr ? opt.labelAr : opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar ── */}
        <aside className={`w-full lg:w-72 flex-shrink-0 transition-all ${mobileFiltersOpen ? "block" : "hidden lg:block"}`}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] lg:overflow-y-auto lg:overflow-x-hidden sidebar-sticky">

            {/* Header */}
            <div className={`flex items-center justify-between mb-5 ${isAr ? "flex-row-reverse" : ""}`}>
              <h2 className="font-bold text-gray-900">{t("filtresLabel")}</h2>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary hover:text-primary-dark font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t("resetFilters")}
                </button>
              )}
            </div>

            {/* ── FILTER 1: LOCALISATION ── */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                📍 Localisation / Mode
              </label>
              <div className="flex flex-wrap gap-2">
                {LOCALISATION_OPTIONS.map((opt) => (
                  <PillButton
                    key={opt.value}
                    value={opt.value}
                    active={localisation === opt.value}
                    onClick={() => {
                      const next = (localisation === opt.value ? "" : opt.value) as JobLocalisation | "";
                      setLocalisation(next);
                      updateURL({ localisation: next });
                    }}
                  >
                    {opt.icon} {opt.label}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* ── FILTER 2: NIVEAU ── */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                🎓 Niveau d'expérience
              </label>
              <div className="flex flex-wrap gap-2">
                {NIVEAU_OPTIONS.map((opt) => (
                  <PillButton
                    key={opt.value}
                    value={opt.value}
                    active={niveau === opt.value}
                    onClick={() => {
                      const next = (niveau === opt.value ? "" : opt.value) as JobNiveau | "";
                      setNiveau(next);
                      updateURL({ niveau: next });
                    }}
                  >
                    {opt.label}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* Keyword */}
            <div className="mb-5">
              <label className={`block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ${isAr ? "text-right" : ""}`}>
                {t("keywordLabel")}
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    updateURL({ keyword: e.target.value });
                  }}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* City */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("cityLabel")}
              </label>
              <select
                value={city}
                onChange={(e) => { setCity(e.target.value); updateURL({ city: e.target.value }); }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
              >
                <option value="">{t("allCities")}</option>
                {cities.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>

            {/* Sector */}
            <div className="mb-5">
              <label className={`block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 ${isAr ? "text-right" : ""}`}>
                {t("sectorLabel")}
              </label>
              <div className="space-y-2">
                {sectors.map((s) => (
                  <label key={s} className={`flex items-center gap-2.5 cursor-pointer group ${isAr ? "flex-row-reverse" : ""}`}>
                    <input
                      type="radio"
                      name="sector"
                      value={s}
                      checked={sector === s}
                      onChange={(e) => { setSector(e.target.value); updateURL({ sector: e.target.value }); }}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-primary transition-colors">
                      {isAr ? (SECTORS_AR[s] || s) : s}
                    </span>
                  </label>
                ))}
                {sector && (
                  <button onClick={() => { setSector(""); updateURL({ sector: "" }); }}
                    className={`text-xs text-gray-400 hover:text-primary mt-1 transition-colors ${isAr ? "block text-right w-full" : ""}`}>
                    {t("clearSelection")}
                  </button>
                )}
              </div>
            </div>

            {/* Contract type */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("contractLabel")}
              </label>
              <div className="flex flex-wrap gap-2">
                {contractTypes.map((ct) => (
                  <PillButton
                    key={ct}
                    value={ct}
                    active={contractType === ct}
                    onClick={() => {
                      const next = contractType === ct ? "" : ct;
                      setContractType(next);
                      updateURL({ contract: next });
                    }}
                  >
                    {ct}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("sourceLabel")}
              </label>
              <div className="space-y-2">
                {sources.map((s) => (
                  <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={source === s}
                      onChange={() => {
                        const next = source === s ? "" : s;
                        setSource(next);
                        updateURL({ source: next });
                      }}
                      className="accent-primary rounded"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-primary transition-colors">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Job grid ── */}
        <div className="flex-1 min-w-0">
          {/* Desktop sort bar */}
          <div className={`hidden lg:flex items-center justify-between mb-6 ${isAr ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
              <h2 className="font-semibold text-gray-700">
                <span className="text-primary font-bold">{filteredJobs.length}</span> {t("resultsCount")}
              </h2>
              {hasFilters && (
                <button onClick={resetFilters}
                  className="text-xs text-gray-400 hover:text-primary transition-colors flex items-center gap-1 border border-gray-200 rounded-full px-2.5 py-1 hover:border-primary">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Réinitialiser les filtres
                </button>
              )}
            </div>
            <div className={`flex items-center gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
              <label className="text-sm text-gray-600 font-medium">{isAr ? "ترتيب:" : "Trier par:"}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm font-medium"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {isAr ? opt.labelAr : opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {localisation && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                  {LOCALISATION_OPTIONS.find(o => o.value === localisation)?.icon} {LOCALISATION_OPTIONS.find(o => o.value === localisation)?.label}
                  <button onClick={() => { setLocalisation(""); updateURL({ localisation: "" }); }} className="ml-1 hover:text-primary-dark">×</button>
                </span>
              )}
              {niveau && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                  🎓 {NIVEAU_OPTIONS.find(o => o.value === niveau)?.label}
                  <button onClick={() => { setNiveau(""); updateURL({ niveau: "" }); }} className="ml-1 hover:text-primary-dark">×</button>
                </span>
              )}
              {contractType && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                  📄 {contractType}
                  <button onClick={() => { setContractType(""); updateURL({ contract: "" }); }} className="ml-1 hover:text-primary-dark">×</button>
                </span>
              )}
              {city && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                  📍 {city}
                  <button onClick={() => { setCity(""); updateURL({ city: "" }); }} className="ml-1 hover:text-primary-dark">×</button>
                </span>
              )}
              {sector && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                  💼 {sector}
                  <button onClick={() => { setSector(""); updateURL({ sector: "" }); }} className="ml-1 hover:text-primary-dark">×</button>
                </span>
              )}
            </div>
          )}

          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-800">Aucune offre ne correspond à vos critères</h3>
              <p className="text-gray-500 mt-2 text-sm">{t("emptyDesc")}</p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                {t("resetFilters")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  const t = useTranslations("offres");
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
      {t("loading")}
    </div>
  );
}

export default function OffresPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OffresContent />
    </Suspense>
  );
}
