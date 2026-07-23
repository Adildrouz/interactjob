"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { Concours } from "@/types";
import { formatDate, hasResults } from "@/lib/concours";
import OrganismeCrest from "@/components/concours/OrganismeCrest";
import { CHIP_SHAPE, BTN_SHAPE_SM, DISPLAY } from "@/lib/design";

const PAGE_SIZE = 20;

export default function ArchivesExplorer({ expired }: { expired: Concours[] }) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return expired;
    return expired.filter((c) => `${c.organization_fr} ${c.title_fr}`.toLowerCase().includes(q));
  }, [expired, query]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
        placeholder="Rechercher dans les archives par ministère ou intitulé…"
        className="w-full px-3 py-2.5 rounded-[12px] rounded-br-[3px] border border-navy-200 text-sm text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-tq-500/30 focus:border-tq-500 mb-6"
      />

      {filtered.length === 0 && (
        <p className="text-navy-400 text-sm">Aucun concours clôturé ne correspond à cette recherche.</p>
      )}

      <div className="space-y-3 opacity-60">
        {filtered.slice(0, visibleCount).map((c) => (
          <Link
            key={c.id}
            href={`/concours/${c.slug}` as "/concours"}
            className={`flex items-start gap-3 bg-white ${CHIP_SHAPE} border border-navy-100 shadow-sm p-4 hover:shadow-md hover:border-navy-300 transition-all`}
          >
            <OrganismeCrest name={c.organization_fr} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-navy-500 line-clamp-1">{c.organization_fr}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-500">Dépôt clos</span>
                {hasResults(c) && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-light text-success">Résultats disponibles</span>
                )}
              </div>
              <h3 className={`${DISPLAY} font-bold text-navy-900 text-sm leading-snug line-clamp-2`}>{c.title_fr}</h3>
              {c.deadline && (
                <p className="text-xs text-navy-400 mt-1.5">Clôturé le {formatDate(c.deadline)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
          className={`mt-4 w-full text-center text-sm font-bold text-navy-700 bg-white border-2 border-navy-200 ${BTN_SHAPE_SM} py-3 hover:border-navy-400 transition-colors opacity-100`}
        >
          Afficher plus ({filtered.length - visibleCount} restants)
        </button>
      )}
    </div>
  );
}
