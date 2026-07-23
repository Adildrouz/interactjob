"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { CalendarClock, Flame, Search, Users, ArrowRight, RotateCcw } from "lucide-react";
import { Concours } from "@/types";
import { formatDate, isExpiringSoon, CONCOURS_SECTORS, CONCOURS_NIVEAUX, matchesNiveau, type ConcoursSector, type MoroccoRegion } from "@/lib/concours";
import { institutionStyle } from "@/lib/concours-institution";
import { trackEvent } from "@/lib/trackEvent";
import OrganismeCrest from "@/components/concours/OrganismeCrest";
import { BTN_SHAPE_SM, CARD_SHAPE, CHIP_SHAPE_SM, DISPLAY, SPRING } from "@/lib/design";

export type EnrichedConcours = Concours & { _sector: ConcoursSector; _region: MoroccoRegion };

const NIVEAU_COLORS: Record<string, string> = {
  "Bac":          "bg-navy-50 text-navy-700",
  "Bac+2":        "bg-tq-50 text-tq-800",
  "Bac+3":        "bg-navy-50 text-navy-700",
  "Licence":      "bg-navy-50 text-navy-700",
  "Master":       "bg-tq-50 text-tq-800",
  "Ingénieur":    "bg-navy-50 text-navy-700",
  "Tous niveaux": "bg-navy-50 text-navy-500",
};

const CLOTURE_OPTIONS = [
  { value: "all", label: "Toutes les dates" },
  { value: "7", label: "Ferme dans 7 jours" },
  { value: "30", label: "Ferme dans 30 jours" },
];

const PAGE_SIZE = 15;

function daysLeft(deadline?: string | null) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function ConcoursExplorer({ active }: { active: EnrichedConcours[] }) {
  const reduce = useReducedMotion();
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
  const selectCls = "border border-navy-200 rounded-[10px] rounded-bl-[2px] px-2.5 py-1.5 text-xs font-medium text-navy-700 bg-white focus:outline-none focus:ring-2 focus:ring-tq-500/30 focus:border-tq-500";

  return (
    <div>
      {/* Filter bar */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur border border-navy-100 rounded-[16px] rounded-tr-[4px] shadow-[0_10px_30px_-18px_rgba(0,52,122,0.3)] px-4 py-3.5 mb-8 space-y-3">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
            onBlur={() => query.trim() && trackEvent("concours_search", { query: query.trim() })}
            placeholder="Rechercher un concours par ministère ou ville…"
            className="w-full pl-9 pr-3 py-2.5 rounded-[12px] rounded-br-[3px] border border-navy-200 text-sm text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-tq-500/30 focus:border-tq-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-navy-400 mr-1">Secteur</span>
          {["Tous", ...CONCOURS_SECTORS, "Administratif"].map((s) => (
            <button
              key={s}
              onClick={() => updateFilter("secteur", s, setSecteur)}
              className={`text-xs px-3 py-1.5 ${CHIP_SHAPE_SM} font-bold transition-colors ${
                secteur === s ? "bg-navy-700 text-white" : "bg-navy-50 text-navy-600 hover:bg-navy-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-navy-400">Région</span>
            <select value={region} onChange={(e) => updateFilter("region", e.target.value, setRegion)} className={selectCls}>
              <option value="Toutes">Toutes</option>
              {availableRegions.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-navy-400">Niveau</span>
            <select value={niveau} onChange={(e) => updateFilter("niveau", e.target.value, setNiveau)} className={selectCls}>
              <option value="Tous">Tous</option>
              {CONCOURS_NIVEAUX.map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-medium text-navy-400">Clôture</span>
            <select value={cloture} onChange={(e) => updateFilter("cloture", e.target.value, setCloture)} className={selectCls}>
              {CLOTURE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
          </label>

          {filtersActive && (
            <button
              onClick={() => { setSecteur("Tous"); setRegion("Toutes"); setNiveau("Tous"); setCloture("all"); setQuery(""); setVisibleCount(PAGE_SIZE); }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-tq-700 hover:text-tq-800 ml-auto"
            >
              <RotateCcw size={13} /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Ferment bientôt — the one place coral belongs: urgency */}
      {!filtersActive && expiringSoon.length > 0 && (
        <section className={`mb-10 ${CARD_SHAPE} border border-coral-100 bg-coral-50/50 p-5`}>
          <h2 className={`${DISPLAY} text-base font-bold text-coral-600 mb-4 flex items-center gap-2`}>
            <Flame size={18} /> Concours qui ferment bientôt ({expiringSoon.length})
          </h2>
          <div className="space-y-2">
            {expiringSoon.slice(0, 6).map((c) => {
              const d = daysLeft(c.deadline);
              return (
                <Link
                  key={c.id}
                  href={`/concours/${c.slug}` as "/concours"}
                  className="flex items-center justify-between gap-3 bg-white rounded-[12px] rounded-br-[3px] border border-coral-100 px-4 py-2.5 hover:border-coral-400 transition-colors"
                >
                  <span className="text-sm text-navy-800 line-clamp-1 flex-1">{c.title_fr}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-coral-600 whitespace-nowrap">
                    <CalendarClock size={13} />
                    {d !== null && d >= 0 ? `J-${d}` : ""} · {formatDate(c.deadline)}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Results */}
      <section className="mb-10">
        <h2 className={`${DISPLAY} text-lg font-bold text-navy-900 mb-4 flex items-center gap-2`}>
          <span className="w-2 h-2 rounded-full bg-tq-500 inline-block" />
          Concours ouverts ({filtered.length})
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.length === 0 && (
            <p className="text-navy-400 text-sm col-span-full">Aucun concours ne correspond à ces filtres.</p>
          )}
          {filtered.slice(0, visibleCount).map((c) => (
            <ConcoursCard key={c.id} concours={c} reduce={!!reduce} />
          ))}
        </div>
        {filtered.length > visibleCount && (
          <button
            onClick={() => { setVisibleCount((v) => v + PAGE_SIZE); trackEvent("concours_show_more"); }}
            className={`mt-6 w-full text-center text-sm font-bold text-navy-700 bg-white border-2 border-navy-200 ${BTN_SHAPE_SM} py-3 hover:border-navy-400 transition-colors`}
          >
            Afficher plus de concours ({filtered.length - visibleCount} restants)
          </button>
        )}
      </section>
    </div>
  );
}

function ConcoursCard({ concours: c, reduce }: { concours: EnrichedConcours; reduce: boolean }) {
  const expiring = isExpiringSoon(c.deadline, 7);
  const niveauClass = c.niveau ? (NIVEAU_COLORS[c.niveau] || "bg-navy-50 text-navy-600") : "";
  const style = institutionStyle(c.organization_fr);
  const d = daysLeft(c.deadline);

  return (
    <motion.div whileHover={reduce ? undefined : { y: -4 }} transition={SPRING} className="h-full">
      <Link
        href={`/concours/${c.slug}` as "/concours"}
        onClick={() => trackEvent("concours_card_click", { sector: c._sector, region: c._region })}
        className={`group relative flex flex-col h-full bg-white ${CARD_SHAPE} border ${
          expiring ? "border-coral-200" : "border-navy-100"
        } shadow-sm hover:shadow-[0_24px_50px_-24px_rgba(0,52,122,0.35)] hover:border-navy-200 transition-[box-shadow,border-color] duration-300 p-5`}
      >
        {/* accent strip encodes institution type at a glance */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 rounded-t-[20px]"
          style={{ background: `linear-gradient(90deg, ${style.accent}, ${style.accentDark})` }}
        />
        <div className="flex items-start gap-3 pt-1">
          <OrganismeCrest name={c.organization_fr} size="md" />
          <div className="flex-1 min-w-0">
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1"
              style={{ color: style.accent, backgroundColor: style.soft }}
            >
              {style.label}
            </span>
            <p className="text-xs font-semibold text-navy-500 line-clamp-1">{c.organization_fr}</p>
            <h3 className={`${DISPLAY} font-bold text-navy-900 text-sm leading-snug line-clamp-2 mt-0.5`}>
              {c.title_fr}
            </h3>
          </div>
        </div>

        {c.title_ar && (
          <p className="text-xs font-normal text-navy-400 mt-2.5 pt-2 border-t border-navy-50 text-right line-clamp-1" dir="rtl">
            {c.title_ar}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {c.postes && (
            <span className="inline-flex items-center gap-1 text-xs bg-navy-50 text-navy-600 px-2 py-0.5 rounded-full">
              <Users size={12} /> {c.postes} poste{c.postes > 1 ? "s" : ""}
            </span>
          )}
          {c.niveau && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${niveauClass}`}>{c.niveau}</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-navy-50 pt-3 mt-3">
          {c.deadline ? (
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                expiring ? "text-coral-600" : "text-navy-500"
              }`}
            >
              <CalendarClock size={13} />
              {expiring && d !== null && d >= 0 ? `J-${d} — ` : "Clôture "}
              {formatDate(c.deadline)}
            </span>
          ) : (
            <span className="text-xs text-navy-400">Publié le {formatDate(c.datePosted)}</span>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-bold text-navy-700 group-hover:text-tq-700 transition-colors">
            Détails <ArrowRight size={14} className={reduce ? "" : "transition-transform group-hover:translate-x-0.5"} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
