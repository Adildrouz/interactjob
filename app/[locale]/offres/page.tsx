"use client";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import JobCard from "@/components/JobCard";
import RecentlyViewed from "@/components/RecentlyViewed";
import jobs from "@/data/jobs.json";
import { Job } from "@/types";

const allJobs = jobs as Job[];

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

function OffresContent() {
  const t = useTranslations("offres");
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [sector, setSector] = useState(searchParams.get("sector") ?? "");
  const [contractType, setContractType] = useState<string>(searchParams.get("contract") ?? "");
  const [source, setSource] = useState(searchParams.get("source") ?? "");

  useEffect(() => {
    setKeyword(searchParams.get("keyword") ?? "");
    setCity(searchParams.get("city") ?? "");
    setSector(searchParams.get("sector") ?? "");
    setContractType(searchParams.get("contract") ?? "");
    setSource(searchParams.get("source") ?? "");
  }, [searchParams]);

  const filteredJobs = useMemo(() => {
    const kw = keyword.toLowerCase();
    return allJobs
      .filter((job) => {
        if (kw && !job.title.toLowerCase().includes(kw) && !job.company.toLowerCase().includes(kw)) return false;
        if (city && job.city !== city) return false;
        if (sector && job.sector !== sector) return false;
        if (contractType && job.contractType !== contractType) return false;
        if (source && job.source !== source) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.sponsored && !b.sponsored) return -1;
        if (!a.sponsored && b.sponsored) return 1;
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
  }, [keyword, city, sector, contractType, source]);

  const hasFilters = keyword || city || sector || contractType || source;

  function resetFilters() {
    setKeyword("");
    setCity("");
    setSector("");
    setContractType("");
    setSource("");
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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hidden lg:block lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] lg:overflow-y-auto lg:overflow-x-hidden sidebar-sticky">
            <div className={`flex items-center justify-between mb-5 ${isAr ? "flex-row-reverse" : ""}`}>
              <h2 className="font-bold text-gray-900">{t("filtresLabel")}</h2>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                >
                  {t("resetFilters")}
                </button>
              )}
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
                  onChange={(e) => setKeyword(e.target.value)}
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
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
              >
                <option value="">{t("allCities")}</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
                      onChange={(e) => setSector(e.target.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-primary transition-colors">
                      {isAr ? (SECTORS_AR[s] || s) : s}
                    </span>
                  </label>
                ))}
                {sector && (
                  <button onClick={() => setSector("")} className={`text-xs text-gray-400 hover:text-primary mt-1 transition-colors ${isAr ? "block text-right w-full" : ""}`}>
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
                  <button
                    key={ct}
                    onClick={() => setContractType(contractType === ct ? "" : ct)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      contractType === ct
                        ? "bg-primary text-white border-primary"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {ct}
                  </button>
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
                      onChange={() => setSource(source === s ? "" : s)}
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
        <div className="flex-1">
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-800">{t("emptyTitle")}</h3>
              <p className="text-gray-500 mt-2 text-sm">{t("emptyDesc")}</p>
              <button
                onClick={resetFilters}
                className="mt-4 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
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
