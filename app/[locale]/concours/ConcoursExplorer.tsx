"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Concours } from "@/types";
import { formatDate, isExpiringSoon, localizedTitle, localizedOrganization, localizedSummary, CONCOURS_SECTORS, CONCOURS_NIVEAUX, matchesNiveau, type ConcoursSector, type MoroccoRegion } from "@/lib/concours";
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

const PAGE_SIZE = 15;

export default function ConcoursExplorer({ active, locale }: { active: EnrichedConcours[]; locale: string }) {
  const t = useTranslations("concours");
  const [secteur, setSecteur] = useState<string>("Tous");
  const [region, setRegion] = useState<string>("Toutes");
  const [niveau, setNiveau] = useState<string>("Tous");
  const [cloture, setCloture] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const CLOTURE_OPTIONS = [
    { value: "all", label: t("clotureAll") },
    { value: "7", label: t("cloture7") },
    { value: "30", label: t("cloture30") },
  ];

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
      if (q && !`${c.organization_fr} ${c.title_fr} ${c.organization_ar} ${c.title_ar}`.toLowerCase().includes(q)) return false;
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
          placeholder={t("searchPlaceholder")}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">{t("sectorLabel")}</span>
          {["Tous", ...CONCOURS_SECTORS, "Administratif"].map((s) => (
            <button
              key={s}
              onClick={() => updateFilter("secteur", s, setSecteur)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                secteur === s ? "bg-primary text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t(`sectors.${s}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-gray-400 uppercase tracking-wider">{t("regionLabel")}</span>
            <select
              value={region}
              onChange={(e) => updateFilter("region", e.target.value, setRegion)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="Toutes">{t("regions.Toutes")}</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>{t(`regions.${r}`)}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-gray-400 uppercase tracking-wider">{t("niveauLabel")}</span>
            <select
              value={niveau}
              onChange={(e) => updateFilter("niveau", e.target.value, setNiveau)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="Tous">{t("niveaux.Tous")}</option>
              {CONCOURS_NIVEAUX.map((n) => (
                <option key={n} value={n}>{t(`niveaux.${n}`)}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-gray-400 uppercase tracking-wider">{t("clotureLabel")}</span>
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
              className="text-xs text-primary hover:underline ms-auto"
            >
              {t("reset")}
            </button>
          )}
        </div>
      </div>

      {/* Ferment bientôt */}
      {!filtersActive && expiringSoon.length > 0 && (
        <section className="mb-8 bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
            {t("closingSoonTitle", { count: expiringSoon.length })}
          </h2>
          <div className="space-y-2">
            {expiringSoon.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/concours/${c.slug}` as any}
                className="flex items-center justify-between gap-3 bg-white rounded-lg border border-orange-100 px-4 py-2.5 hover:border-orange-300 transition-colors"
              >
                <span className="text-sm text-gray-800 line-clamp-1 flex-1">{localizedTitle(c, locale)}</span>
                <span className="text-xs font-semibold text-orange-600 whitespace-nowrap">{t("closureLabel", { date: formatDate(c.deadline, locale) })}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          {t("openTitle", { count: filtered.length })}
        </h2>
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-gray-400 text-sm">{t("noResults")}</p>
          )}
          {filtered.slice(0, visibleCount).map((c) => (
            <ConcoursCard key={c.id} concours={c} locale={locale} t={t} />
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
            {t("showMore", { count: filtered.length - visibleCount })}
          </button>
        )}
      </section>
    </div>
  );
}

function ConcoursCard({ concours: c, locale, t }: { concours: EnrichedConcours; locale: string; t: ReturnType<typeof useTranslations> }) {
  const expiring = isExpiringSoon(c.deadline, 7);
  const niveauClass = c.niveau ? (NIVEAU_COLORS[c.niveau] || "bg-gray-100 text-gray-600") : "";
  const isAr = locale === "ar";
  const secondaryTitle = isAr ? c.title_fr : c.title_ar;

  return (
    <Link
      href={`/concours/${c.slug}` as any}
      onClick={() => trackEvent("concours_card_click", { sector: c._sector, region: c._region })}
      className={`block bg-white rounded-xl border ${expiring ? "border-orange-200" : "border-gray-100"} shadow-sm p-5 hover:shadow-md hover:border-primary transition-all`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-primary mb-1">{localizedOrganization(c, locale)}</p>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
            {localizedTitle(c, locale)}
          </h3>
          {secondaryTitle && (
            <p
              className="text-xs font-normal text-gray-400 mt-2 pt-2 border-t border-gray-50 line-clamp-1"
              dir={isAr ? "ltr" : "rtl"}
            >
              {secondaryTitle}
            </p>
          )}
          {localizedSummary(c, locale) && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{localizedSummary(c, locale)}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {!!c.postes && (
              <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">
                {t("postesCount", { count: c.postes })}
              </span>
            )}
            {c.niveau && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${niveauClass}`}>
                {c.niveau}
              </span>
            )}
            {c.deadline && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${expiring ? "bg-orange-50 text-orange-600 font-semibold" : "bg-gray-50 text-gray-500"}`}>
                {expiring ? "⚡ " : ""}{t("closureLabel", { date: formatDate(c.deadline, locale) })}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {t("publishedOn", { date: formatDate(c.datePosted, locale) })}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-300 text-lg mt-1">→</div>
      </div>
    </Link>
  );
}
