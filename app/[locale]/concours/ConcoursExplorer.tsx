"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { Concours } from "@/types";
import { formatDate, isExpiringSoon, CONCOURS_SECTORS, CONCOURS_NIVEAUX, matchesNiveau, type ConcoursSector, type MoroccoRegion } from "@/lib/concours";
import { trackEvent } from "@/lib/trackEvent";

export type EnrichedConcours = Concours & { _sector: ConcoursSector; _region: MoroccoRegion };

const NIVEAU_COLORS: Record<string, string> = {
  "Bac":          "bg-blue-50 text-blue-700",
  "Bac+2":        "bg-purple-50 text-purple-700",
  "Bac+3":        "bg-indigo-50 text-indigo-700",
  "Licence":      "bg-indigo-50 text-indigo-700",
  "Master":       "bg-orange-50 text-orange-700",
  "Ingénieur":    "bg-green-50 text-green-700",
  "Tous niveaux": "bg-gray-100 text-gray-600",
};

const CLOTURE_OPTIONS = [
  { value: "all", label: "Toutes les dates" },
  { value: "7", label: "Ferme dans 7 jours" },
  { value: "30", label: "Ferme dans 30 jours" },
];

const PAGE_SIZE = 15;

export default function ConcoursExplorer({ active }: { active: EnrichedConcours[] }) {
  const [secteur, setSecteur] = useState<string>("Tous");
  const [region, setRegion] = useState<string>("Toutes");
  const [niveau, setNiveau] = useState<string>("Tous");
  const [cloture, setCloture] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    for (const c of active) set.add(c._region);
    return Array.from(set).sort((a, b) => (a === "National" ? 1 : b === "National" ? -1 : a.localeCompare(b)));
  }, [active]);

  const expiringSoon = useMemo(
    () => active.filter((c) => isExpiringSoon(c.deadline, 7)).sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()),
    [active]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active.filter((c) => {
      if (secteur !== "Tous" && c._sector !== secteur) return false;
      if (region !== "Toutes" && c._region !== region) return false;
      if (niveau !== "Tous" && !matchesNiveau(c, niveau)) return false;
      if (cloture !== "all" && !isExpiringSoon(c.deadline, parseInt(cloture, 10))) return false;
      if (q && !`${c.organization_fr} ${c.title_fr}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [active, secteur, region, niveau, cloture, query]);

  function updateFilter(kind: string, value: string, setter: (v: string) => void) {
    setter(value);
    setVisibleCount(PAGE_SIZE);
    trackEvent("concours_filter_click", { filter: kind, value });
  }

  const filtersActive = secteur !== "Tous" || region !== "Toutes" || niveau !== "Tous" || cloture !== "all" || query.trim() !== "";

  return (
    <div>
      {/* Sticky filter bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border border-gray-100 rounded-xl shadow-sm px-4 py-3 mb-6 space-y-3">
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
          onBlur={() => query.trim() && trackEvent("concours_search", { query: query.trim() })}
          placeholder="Rechercher un concours par ministère ou ville…"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Secteur</span>
          {["Tous", ...CONCOURS_SECTORS, "Administratif"].map((s) => (
            <button
              key={s}
              onClick={() => updateFilter("secteur", s, setSecteur)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                secteur === s ? "bg-primary text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-gray-400 uppercase tracking-wider">Région</span>
            <select
              value={region}
              onChange={(e) => updateFilter("region", e.target.value, setRegion)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="Toutes">Toutes</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-gray-400 uppercase tracking-wider">Niveau</span>
            <select
              value={niveau}
              onChange={(e) => updateFilter("niveau", e.target.value, setNiveau)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="Tous">Tous</option>
              {CONCOURS_NIVEAUX.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-gray-400 uppercase tracking-wider">Clôture</span>
            <select
              value={cloture}
              onChange={(e) => updateFilter("cloture", e.target.value, setCloture)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CLOTURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          {filtersActive && (
            <button
              onClick={() => { setSecteur("Tous"); setRegion("Toutes"); setNiveau("Tous"); setCloture("all"); setQuery(""); setVisibleCount(PAGE_SIZE); }}
              className="text-xs text-primary hover:underline ml-auto"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Ferment bientôt */}
      {!filtersActive && expiringSoon.length > 0 && (
        <section className="mb-8 bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
            ⚡ Concours qui ferment bientôt ({expiringSoon.length})
          </h2>
          <div className="space-y-2">
            {expiringSoon.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/concours/${c.slug}` as any}
                className="flex items-center justify-between gap-3 bg-white rounded-lg border border-orange-100 px-4 py-2.5 hover:border-orange-300 transition-colors"
              >
                <span className="text-sm text-gray-800 line-clamp-1 flex-1">{c.title_fr}</span>
                <span className="text-xs font-semibold text-orange-600 whitespace-nowrap">Clôture : {formatDate(c.deadline)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Concours ouverts ({filtered.length})
        </h2>
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-gray-400 text-sm">Aucun concours ne correspond à ces filtres.</p>
          )}
          {filtered.slice(0, visibleCount).map((c) => (
            <ConcoursCard key={c.id} concours={c} />
          ))}
        </div>
        {filtered.length > visibleCount && (
          <button
            onClick={() => {
              setVisibleCount((v) => v + PAGE_SIZE);
              trackEvent("concours_show_more");
            }}
            className="mt-4 w-full text-center text-sm font-semibold text-primary bg-white border border-gray-200 rounded-xl py-3 hover:bg-gray-50 transition-colors"
          >
            Afficher plus de concours ({filtered.length - visibleCount} restants)
          </button>
        )}
      </section>
    </div>
  );
}

function ConcoursCard({ concours: c }: { concours: EnrichedConcours }) {
  const expiring = isExpiringSoon(c.deadline, 7);
  const niveauClass = c.niveau ? (NIVEAU_COLORS[c.niveau] || "bg-gray-100 text-gray-600") : "";

  return (
    <Link
      href={`/concours/${c.slug}` as any}
      onClick={() => trackEvent("concours_card_click", { sector: c._sector, region: c._region })}
      className={`block bg-white rounded-xl border ${expiring ? "border-orange-200" : "border-gray-100"} shadow-sm p-5 hover:shadow-md hover:border-primary transition-all`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary mb-1">{c.organization_fr}</p>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {c.title_fr}
          </h3>
          {c.title_ar && (
            <p className="text-xs text-gray-400 mt-1 text-right dir-rtl line-clamp-1" dir="rtl">
              {c.title_ar}
            </p>
          )}
          {c.summary_fr && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.summary_fr}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {c.postes && (
              <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">
                {c.postes} poste{c.postes > 1 ? "s" : ""}
              </span>
            )}
            {c.niveau && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${niveauClass}`}>
                {c.niveau}
              </span>
            )}
            {c.deadline && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${expiring ? "bg-orange-50 text-orange-600 font-semibold" : "bg-gray-50 text-gray-500"}`}>
                {expiring ? "⚡ " : ""}Clôture : {formatDate(c.deadline)}
              </span>
            )}
            <span className="text-xs text-gray-400">
              Publié le {formatDate(c.datePosted)}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-300 text-lg mt-1">→</div>
      </div>
    </Link>
  );
}
