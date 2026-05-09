"use client";
import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import JobCard from "@/components/JobCard";
import jobs from "@/data/jobs.json";
import { Job } from "@/types";

const allJobs = jobs as Job[];

const sectors = ["IT", "Finance", "Hôtellerie", "RH", "Administratif", "Commerce", "Marketing", "Industrie", "Santé", "BTP", "Logistique", "Éducation"];
const contractTypes: Job["contractType"][] = ["CDI", "CDD", "Stage"];
const cities = [
  "Casablanca", "Rabat", "Marrakech", "Fès", "Agadir",
  "Tanger", "Meknès", "Khouribga", "Oujda", "Tétouan", "Essaouira",
];
const sources: Job["source"][] = ["Rekrute.com", "Emploi.ma", "Bayt.com", "Direct"];

function OffresContent() {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Offres d&apos;emploi au Maroc</h1>
        <p className="text-gray-500 mt-1">
          {filteredJobs.length} offre{filteredJobs.length !== 1 ? "s" : ""} trouvée{filteredJobs.length !== 1 ? "s" : ""}
          {hasFilters ? " pour votre recherche" : ""}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Filtres</h2>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary hover:text-primary-dark font-medium transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Keyword */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Mot-clé
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Titre, entreprise..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* City */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Ville
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors bg-white"
              >
                <option value="">Toutes les villes</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Secteur
              </label>
              <div className="space-y-2">
                {sectors.map((s) => (
                  <label key={s} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="sector"
                      value={s}
                      checked={sector === s}
                      onChange={(e) => setSector(e.target.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-primary transition-colors">{s}</span>
                  </label>
                ))}
                {sector && (
                  <button onClick={() => setSector("")} className="text-xs text-gray-400 hover:text-primary mt-1 transition-colors">
                    Effacer la sélection
                  </button>
                )}
              </div>
            </div>

            {/* Contract type */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Type de contrat
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
                Source
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
              <h3 className="text-lg font-semibold text-gray-800">Aucune offre trouvée</h3>
              <p className="text-gray-500 mt-2 text-sm">
                Essayez de modifier vos critères de recherche.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Réinitialiser les filtres
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

export default function OffresPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-500">
          Chargement des offres...
        </div>
      }
    >
      <OffresContent />
    </Suspense>
  );
}
