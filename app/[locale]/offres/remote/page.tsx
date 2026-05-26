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

type WorkMode  = "full-remote" | "remote-maroc" | "remote-uk-eu";
type Niveau    = "stage" | "early-pro" | "junior" | "intermediaire" | "senior";
type EnrichedJob = RemoteJob & { _workMode: WorkMode; _niveau: Niveau };

import remoteJobsRaw from "@/data/remote-jobs.json";
const rawJobs = remoteJobsRaw as unknown as RemoteJob[];

// ── Inference helpers ────────────────────────────────────────────────────────
function inferWorkMode(job: RemoteJob): WorkMode {
  const text = `${job.title} ${job.summary}`.toLowerCase();
  if (/\bmaroc\b|\bmorocco\b|\bmaghreb\b|\bafrique\b|\bafrica\b/.test(text) || job.source === "InteractJob")
    return "remote-maroc";
  if (/\bunitedkingdom\b|\bunited kingdom\b|\blondon\b|\bberlin\b|\bparis\b|\bemea\b/.test(text))
    return "remote-uk-eu";
  return "full-remote";
}

function inferNiveau(job: RemoteJob): Niveau {
  const text = `${job.title} ${job.summary}`.toLowerCase();
  if (/\bintern\b|\binternship\b|\bstage\b|\bstagiaire\b|\btrainee\b/.test(text)) return "stage";
  if (/\bsenior\b|\blead\b|\bmanager\b|\bdirector\b|\bhead of\b|\bvp\b|\bprincipal\b|\bstaff\b/.test(text)) return "senior";
  if (/\bjunior\b/.test(text)) return "junior";
  if (/\bentry.?level\b|\bno experience\b|\b0.?1\s*year/.test(text)) return "early-pro";
  return "intermediaire";
}

const enrichedJobs: EnrichedJob[] = rawJobs.map(j => ({
  ...j,
  _workMode: inferWorkMode(j),
  _niveau:   inferNiveau(j),
}));

// ── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ["Toutes", "Development", "Marketing", "Design", "HR", "Finance", "Customer Support", "Product", "General"];

const WORKMODE_OPTIONS: { value: WorkMode | ""; label: string; icon: string }[] = [
  { value: "",             label: "Toutes",             icon: "🌍" },
  { value: "full-remote",  label: "Full Remote",         icon: "🏠" },
  { value: "remote-maroc", label: "Remote depuis Maroc", icon: "🇲🇦" },
  { value: "remote-uk-eu", label: "Remote UK / Europe",  icon: "🇪🇺" },
];

const NIVEAU_OPTIONS: { value: Niveau | ""; label: string }[] = [
  { value: "",              label: "Tous niveaux"            },
  { value: "stage",         label: "Stage / Fin d'études"    },
  { value: "early-pro",     label: "Early Pro (0–1 an)"      },
  { value: "junior",        label: "Junior (1–2 ans)"        },
  { value: "intermediaire", label: "Intermédiaire (2–5 ans)" },
  { value: "senior",        label: "Senior (5+ ans)"         },
];

const SOURCE_BADGE: Record<string, string> = {
  WeWorkRemotely: "WWR", Remotive: "Remotive", RemoteOK: "RemoteOK",
  Himalayas: "Himalayas", WorkingNomads: "Nomads",
  "Remote.co": "Remote.co", Jobspresso: "Jobspresso", InteractJob: "InteractJob",
};

const CATEGORY_COLOR: Record<string, string> = {
  Development: "bg-blue-100 text-blue-700",   Marketing: "bg-pink-100 text-pink-700",
  Design: "bg-purple-100 text-purple-700",    HR: "bg-orange-100 text-orange-700",
  Finance: "bg-emerald-100 text-emerald-700", "Customer Support": "bg-yellow-100 text-yellow-700",
  Product: "bg-cyan-100 text-cyan-700",       General: "bg-gray-100 text-gray-600",
};

const NIVEAU_COLOR: Record<Niveau, string> = {
  stage: "bg-violet-100 text-violet-700", "early-pro": "bg-blue-100 text-blue-700",
  junior: "bg-sky-100 text-sky-700",      intermediaire: "bg-amber-100 text-amber-700",
  senior: "bg-rose-100 text-rose-700",
};

const NIVEAU_LABEL: Record<Niveau, string> = {
  stage: "Stage", "early-pro": "Early Pro",
  junior: "Junior", intermediaire: "Intermédiaire", senior: "Senior",
};

const WORKMODE_LABEL: Record<WorkMode, string> = {
  "full-remote": "🏠 Full Remote", "remote-maroc": "🇲🇦 Remote Maroc", "remote-uk-eu": "🇪🇺 Remote EU",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `il y a ${d}j`;
  if (h > 0) return `il y a ${h}h`;
  return "récemment";
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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

// ── Page component ────────────────────────────────────────────────────────────
export default function RemotePage() {
  const [workMode,          setWorkMode]          = useState<WorkMode | "">("");
  const [niveau,            setNiveau]            = useState<Niveau | "">("");
  const [category,          setCategory]          = useState("Toutes");
  const [keyword,           setKeyword]           = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const kw = keyword.toLowerCase().trim();
    return enrichedJobs.filter(j => {
      if (workMode && j._workMode !== workMode)                                                   return false;
      if (niveau   && j._niveau   !== niveau)                                                     return false;
      if (category !== "Toutes" && j.category !== category)                                       return false;
      if (kw && !j.title.toLowerCase().includes(kw) && !j.company.toLowerCase().includes(kw))    return false;
      return true;
    });
  }, [workMode, niveau, category, keyword]);

  const hasFilters = !!workMode || !!niveau || category !== "Toutes" || !!keyword;

  function resetFilters() {
    setWorkMode("");
    setNiveau("");
    setCategory("Toutes");
    setKeyword("");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🌍</span>
          <h1 className="text-3xl font-bold text-gray-900">Offres Remote — Travaillez de partout</h1>
        </div>
        <p className="text-gray-500 mt-1">Les meilleures offres remote globales, mises à jour toutes les heures</p>
        <p className="text-sm text-gray-400 mt-1">{filtered.length} offres disponibles</p>
      </div>

      {/* Mobile toolbar */}
      <div className="lg:hidden flex gap-3 mb-6">
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg hover:border-primary hover:text-primary transition-colors font-medium text-sm flex-1 ${hasFilters ? "border-primary text-primary" : "border-gray-200"}`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {mobileFiltersOpen ? "Masquer" : hasFilters ? "Filtres (actifs)" : "Filtrer"}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className={`w-full lg:w-64 flex-shrink-0 ${mobileFiltersOpen ? "block" : "hidden lg:block"}`}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] lg:overflow-y-auto">

            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Filtres</h2>
              {hasFilters && (
                <button onClick={resetFilters} className="text-xs text-primary hover:text-primary-dark font-medium transition-colors flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Réinitialiser
                </button>
              )}
            </div>

            {/* FILTER 1: WORK MODE */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                📍 Localisation / Work Mode
              </label>
              <div className="flex flex-wrap gap-2">
                {WORKMODE_OPTIONS.map(opt => (
                  <PillButton
                    key={opt.value}
                    active={workMode === opt.value}
                    onClick={() => setWorkMode(opt.value as WorkMode)}
                  >
                    {opt.icon} {opt.label}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* FILTER 2: NIVEAU */}
            <div className="mb-5 pb-5 border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                🎓 Niveau d&apos;expérience
              </label>
              <div className="flex flex-wrap gap-2">
                {NIVEAU_OPTIONS.map(opt => (
                  <PillButton
                    key={opt.value}
                    active={niveau === opt.value}
                    onClick={() => setNiveau(opt.value as Niveau)}
                  >
                    {opt.label}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* Keyword search */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recherche</label>
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

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Catégorie</label>
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

        {/* Job grid */}
        <div className="flex-1 min-w-0">
          <div className="hidden lg:flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600">
              <span className="text-primary font-bold">{filtered.length}</span> offres disponibles
            </p>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-gray-400 hover:text-primary transition-colors flex items-center gap-1 border border-gray-200 rounded-full px-2.5 py-1 hover:border-primary"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Réinitialiser les filtres
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {workMode && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                  {WORKMODE_OPTIONS.find(o => o.value === workMode)?.icon}{" "}
                  {WORKMODE_OPTIONS.find(o => o.value === workMode)?.label}
                  <button onClick={() => setWorkMode("")} className="ml-1 hover:text-primary-dark">×</button>
                </span>
              )}
              {niveau && (
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
                  🎓 {NIVEAU_OPTIONS.find(o => o.value === niveau)?.label}
                  <button onClick={() => setNiveau("")} className="ml-1 hover:text-primary-dark">×</button>
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
                  🔍 &ldquo;{keyword}&rdquo;
                  <button onClick={() => setKeyword("")} className="ml-1 hover:text-primary-dark">×</button>
                </span>
              )}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-800">Aucune offre ne correspond à vos critères</h3>
              <p className="text-gray-500 mt-2 text-sm">Essayez une autre combinaison de filtres ou revenez dans quelques heures.</p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                Voir toutes les offres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {filtered.map(job => <RemoteJobCard key={job.id} job={job} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
function RemoteJobCard({ job }: { job: EnrichedJob }) {
  const catColor    = CATEGORY_COLOR[job.category] ?? "bg-gray-100 text-gray-600";
  const srcLabel    = SOURCE_BADGE[job.source]     ?? job.source;
  const niveauColor = NIVEAU_COLOR[job._niveau];
  const niveauLabel = NIVEAU_LABEL[job._niveau];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-primary/20 transition-all">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          {WORKMODE_LABEL[job._workMode]}
        </span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>{job.category}</span>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${niveauColor}`}>{niveauLabel}</span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{srcLabel}</span>
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{job.title}</h3>
        <p className="text-sm text-gray-500 mt-0.5 font-medium">{job.company}</p>
      </div>
      {job.summary && <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{job.summary}</p>}
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
