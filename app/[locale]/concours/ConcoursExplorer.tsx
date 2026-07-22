"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, HeartPulse, GraduationCap, Shield, Coins, Wrench, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Concours } from "@/types";
import {
  isExpiringSoon,
  CONCOURS_SECTORS,
  CONCOURS_NIVEAUX,
  matchesNiveau,
  inferOnlineSubmission,
  inferAnnonceType,
  type ConcoursSector,
  type MoroccoRegion,
  type OrganismeSummary,
} from "@/lib/concours";
import { trackEvent } from "@/lib/trackEvent";
import HeroSearch from "@/components/concours/HeroSearch";
import StatsCards from "@/components/concours/StatsCards";
import UrgencyCarousel from "@/components/concours/UrgencyCarousel";
import ConcoursCard from "@/components/concours/ConcoursCard";
import AdministrationsGrid from "@/components/concours/AdministrationsGrid";
import ConversionCTAs from "@/components/concours/ConversionCTAs";

export type EnrichedConcours = Concours & { _sector: ConcoursSector; _region: MoroccoRegion };

const CLOTURE_OPTIONS = [
  { value: "all", label: "Toutes les dates" },
  { value: "7", label: "Ferme dans 7 jours" },
  { value: "30", label: "Ferme dans 30 jours" },
];

const PAGE_SIZE = 15;

const SECTOR_ICONS: Record<string, LucideIcon> = {
  Tous: LayoutGrid,
  "Santé": HeartPulse,
  "Éducation": GraduationCap,
  "Sécurité": Shield,
  Finance: Coins,
  "Ingénierie": Wrench,
  Administratif: Building2,
};

const GRID_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

function scrollToResults() {
  document.getElementById("concours-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ConcoursExplorer({ active, organismes, totalPostes }: { active: EnrichedConcours[]; organismes: OrganismeSummary[]; totalPostes: number }) {
  const [query, setQuery] = useState("");
  const [annonceType, setAnnonceType] = useState("Tous");
  const [secteur, setSecteur] = useState<string>("Tous");
  const [region, setRegion] = useState<string>("Toutes");
  const [niveau, setNiveau] = useState<string>("Tous");
  const [cloture, setCloture] = useState<string>("all");
  const [onlineOnly, setOnlineOnly] = useState(false);
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
      if (onlineOnly && !inferOnlineSubmission(c)) return false;
      if (annonceType !== "Tous" && inferAnnonceType(c) !== annonceType) return false;
      if (q && !`${c.organization_fr} ${c.title_fr}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [active, secteur, region, niveau, cloture, onlineOnly, annonceType, query]);

  function updateFilter(kind: string, value: string, setter: (v: string) => void) {
    setter(value);
    setVisibleCount(PAGE_SIZE);
    trackEvent("concours_filter_click", { filter: kind, value });
  }

  const filtersActive = secteur !== "Tous" || region !== "Toutes" || niveau !== "Tous" || cloture !== "all" || onlineOnly || annonceType !== "Tous" || query.trim() !== "";

  // Changes only when the filter set changes (not on "load more") so the grid
  // replays its staggered entrance as a smooth reflow when filtering.
  const filterSignature = `${secteur}|${region}|${niveau}|${cloture}|${onlineOnly}|${annonceType}|${query.trim()}`;

  return (
    <div>
      <HeroSearch
        query={query}
        onQueryChange={(v) => { setQuery(v); setVisibleCount(PAGE_SIZE); }}
        annonceType={annonceType}
        onAnnonceTypeChange={(v) => updateFilter("annonceType", v, setAnnonceType)}
        resultCount={active.length}
        onSubmit={() => { trackEvent("concours_search", { query: query.trim() }); scrollToResults(); }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <StatsCards
        activeCount={active.length}
        totalPostes={totalPostes}
        expiringSoonCount={expiringSoon.length}
        organismeCount={organismes.length}
      />

      <UrgencyCarousel items={expiringSoon} />

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border border-concours-border rounded-xl shadow-sm px-4 py-3 mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Secteur</span>
          {["Tous", ...CONCOURS_SECTORS, "Administratif"].map((s) => {
            const Icon = SECTOR_ICONS[s] ?? LayoutGrid;
            const isActive = secteur === s;
            return (
              <button
                key={s}
                onClick={() => updateFilter("secteur", s, setSecteur)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  isActive ? "bg-concours-navy text-white shadow-sm" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                {s}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-gray-400 uppercase tracking-wider">Région</span>
            <select
              value={region}
              onChange={(e) => updateFilter("region", e.target.value, setRegion)}
              className="border border-concours-border rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-concours-turquoise/30"
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
              className="border border-concours-border rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-concours-turquoise/30"
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
              className="border border-concours-border rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-concours-turquoise/30"
            >
              {CLOTURE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlineOnly}
              onChange={(e) => { setOnlineOnly(e.target.checked); setVisibleCount(PAGE_SIZE); trackEvent("concours_filter_click", { filter: "onlineOnly", value: String(e.target.checked) }); }}
              className="accent-concours-turquoise"
            />
            <span className="font-semibold text-gray-500">Dépôt en ligne uniquement</span>
          </label>

          {filtersActive && (
            <button
              onClick={() => {
                setSecteur("Tous"); setRegion("Toutes"); setNiveau("Tous"); setCloture("all");
                setOnlineOnly(false); setAnnonceType("Tous"); setQuery(""); setVisibleCount(PAGE_SIZE);
              }}
              className="text-xs text-concours-navy font-semibold hover:underline ml-auto"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <section id="concours-results" className="mb-10 scroll-mt-32">
        <h2 className="text-lg font-bold text-concours-navy mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-concours-green inline-block" />
          Concours ouverts ({filtered.length})
        </h2>
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun concours ne correspond à ces filtres.</p>
        ) : (
          <motion.div
            key={filterSignature}
            variants={GRID_CONTAINER}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch"
          >
            {filtered.slice(0, visibleCount).map((c) => (
              <ConcoursCard key={c.id} concours={c} />
            ))}
          </motion.div>
        )}
        {filtered.length > visibleCount && (
          <button
            onClick={() => {
              setVisibleCount((v) => v + PAGE_SIZE);
              trackEvent("concours_show_more");
            }}
            className="mt-4 w-full text-center text-sm font-semibold text-concours-navy bg-white border border-concours-border rounded-xl py-3 hover:bg-concours-bg transition-colors"
          >
            Afficher plus de concours ({filtered.length - visibleCount} restants)
          </button>
        )}
      </section>

      <AdministrationsGrid
        organismes={organismes}
        onConsulter={(name) => { setQuery(name); setVisibleCount(PAGE_SIZE); scrollToResults(); }}
      />

      <ConversionCTAs
        active={active}
        onCheckEligibility={(n) => { updateFilter("niveau", n, setNiveau); scrollToResults(); }}
      />
      </div>
    </div>
  );
}
