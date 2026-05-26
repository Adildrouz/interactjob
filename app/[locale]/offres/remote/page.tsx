"use client";
import { useState, useMemo } from "react";

type RemoteJob = {
  id: string;
  title: string;
  company: string;
  link: string;
  published: string;
  summary: string;
  source: string;
  category: string;
  scrapedAt: string;
};

// Static import — refreshed on every Vercel deploy triggered by the scraper
import remoteJobsRaw from "@/data/remote-jobs.json";
const allJobs = remoteJobsRaw as unknown as RemoteJob[];

const CATEGORIES = [
  "Toutes",
  "Development",
  "Marketing",
  "Design",
  "HR",
  "Finance",
  "Customer Support",
  "Product",
  "General",
];

const SOURCE_BADGE: Record<string, string> = {
  WeWorkRemotely: "WWR",
  Remotive:       "Remotive",
  RemoteOK:       "RemoteOK",
  Himalayas:      "Himalayas",
  WorkingNomads:  "Nomads",
  "Remote.co":    "Remote.co",
  Jobspresso:     "Jobspresso",
  InteractJob:    "InteractJob",
};

const SOURCE_OPTIONS = [
  { value: "",               label: "Toutes les sources" },
  { value: "Himalayas",      label: "🏔 Himalayas"       },
  { value: "WeWorkRemotely", label: "💼 WeWorkRemotely"  },
  { value: "Remotive",       label: "🚀 Remotive"        },
  { value: "RemoteOK",       label: "✅ RemoteOK"        },
  { value: "WorkingNomads",  label: "🧳 Working Nomads"  },
  { value: "Remote.co",      label: "🌐 Remote.co"       },
  { value: "Jobspresso",     label: "☕ Jobspresso"       },
];

const CATEGORY_COLOR: Record<string, string> = {
  Development:      "bg-blue-100 text-blue-700",
  Marketing:        "bg-pink-100 text-pink-700",
  Design:           "bg-purple-100 text-purple-700",
  HR:               "bg-orange-100 text-orange-700",
  Finance:          "bg-emerald-100 text-emerald-700",
  "Customer Support":"bg-yellow-100 text-yellow-700",
  Product:          "bg-cyan-100 text-cyan-700",
  General:          "bg-gray-100 text-gray-600",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `il y a ${d}j`;
  if (h > 0) return `il y a ${h}h`;
  return "récemment";
}

function PillButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
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

export default function RemotePage() {
  const [category, setCategory] = useState("Toutes");
  const [source, setSource]     = useState("");
  const [keyword, setKeyword]   = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const kw = keyword.toLowerCase();
    return allJobs.filter(j => {
      if (category !== "Toutes" && j.category !== category) return false;
      if (source && j.source !== source) return false;
      if (kw && !j.title.toLowerCase().includes(kw) && !j.company.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [category, source, keyword]);

  const hasFilters = category !== "Toutes" || !!source || !!keyword;

  function resetFilters() {
    setCategory("Toutes");
    setSource("");
    setKeyword("");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🌍</span>
          <h1 className="text-3xl font-bold text-gray-900">
            Offres Remote — Travaillez de partout
          </h1>
        </div>
        <p className="text-gray-500 mt-1">
          Les meilleures offres remote globales, mises à jour toutes les heures
        </p>
        <p className="text-sm text-gray-400 mt-1">{filtered.length} offres disponibles</p>
      </div>

      {/* Mobile toolbar */}
      <div className="lg:hidden flex gap-3 mb-6">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg hover:border-primary hover:text-primary transition-colors font-medium text-sm flex-1 ${
            hasFilters ? "border-primary text-primary" : "border-gray-200"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {mobileFiltersOpen ? "Masquer" : hasFilters ? "Filtres (actifs)" : "Filtrer"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar ── */}
        <aside className={`w-full lg:w-64 flex-shrink-0 transition-all ${mobileFiltersOpen ? "block" : "hidden lg:block"}`}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] lg:overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Filtres</h2>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-primary hover:text-primary-dark font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Keyword */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Recherche
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Titre, entreprise…"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>
            </div>

            {/* Source filter */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                🌐 Source
              </label>
              <div className="flex flex-wrap gap-2">
                {SOURCE_OPTIONS.map(opt => (
                  <PillButton
                    key={opt.value}
                    active={source === opt.value}
                    onClick={() => setSource(source === opt.value ? "" : opt.value)}
                  >
                    {opt.label}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Catégorie
              </label>
              <div className="space-y-1.5">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      category === cat
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── Job grid ── */}
        <div className="flex-1 min-w-0">
          {/* Result count + active chips */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-600">
                <span className="text-primary font-bold">{filtered.length}</span> offres disponibles
              </p>
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
            {hasFilters && (
              <div className="flex flex-wrap gap-2">
                {source && (
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                    🌐 {SOURCE_OPTIONS.find(o => o.value === source)?.label.replace(/^.{2}\s/, "")}
                    <button onClick={() => setSource("")} className="ml-1 hover:text-primary-dark">×</button>
                  </span>
                )}
                {category !== "Toutes" && (
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                    💼 {category}
                    <button onClick={() => setCategory("Toutes")} className="ml-1 hover:text-primary-dark">×</button>
                  </span>
                )}
                {keyword && (
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                    🔍 "{keyword}"
                    <button onClick={() => setKeyword("")} className="ml-1 hover:text-primary-dark">×</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-800">Aucune offre ne correspond à vos critères</h3>
              <p className="text-gray-500 mt-2 text-sm">
                Essayez une autre catégorie ou revenez dans quelques heures.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                Voir toutes les offres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filtered.map(job => (
                <RemoteJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RemoteJobCard({ job }: { job: RemoteJob }) {
  const catColor  = CATEGORY_COLOR[job.category] ?? "bg-gray-100 text-gray-600";
  const srcLabel  = SOURCE_BADGE[job.source] ?? job.source;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-primary/20 transition-all">
      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          🌍 Remote Global
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>
          {job.category}
        </span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
          {srcLabel}
        </span>
      </div>

      {/* Title + company */}
      <div>
        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
          {job.title}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5 font-medium">{job.company}</p>
      </div>

      {/* Summary */}
      {job.summary && (
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {job.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">{timeAgo(job.published)}</span>
        <a
          href={`/offres/remote/${job.id}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors"
        >
          Voir l&apos;offre
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
