"use client";

import { Link } from "@/i18n/routing";
import { Bell, Briefcase } from "lucide-react";
import { Concours } from "@/types";
import { formatDate } from "@/lib/concours";
import { trackEvent } from "@/lib/trackEvent";
import OrganismeCrest from "./OrganismeCrest";

function daysRemaining(deadline: string) {
  const diff = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(diff));
}

export default function UrgencyCarousel({ items }: { items: Concours[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-concours-navy mb-4 flex items-center gap-2">
        ⚡ Dernière chance pour postuler
        <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{items.length}</span>
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scroll-smooth">
        {items.map((c) => {
          const days = daysRemaining(c.deadline!);
          return (
            <Link
              key={c.id}
              href={`/concours/${c.slug}` as any}
              onClick={() => trackEvent("concours_urgency_click", { slug: c.slug })}
              className="flex-shrink-0 w-72 snap-start bg-white rounded-2xl border border-orange-200 shadow-sm p-4 hover:shadow-lg hover:border-orange-400 transition-all"
            >
              <div className="flex items-start gap-2.5">
                <OrganismeCrest name={c.organization_fr} size="sm" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-concours-navy text-xs leading-snug line-clamp-2">{c.title_fr}</h3>
                  <p className="text-[11px] text-gray-500 line-clamp-1 mt-1">{c.organization_fr}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    trackEvent("concours_bell_click", { slug: c.slug, source: "urgency" });
                    document.getElementById("concours-alerts")?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  aria-label="Créer une alerte"
                  className="flex-shrink-0 text-gray-300 hover:text-concours-turquoise"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs font-bold text-red-600 mt-2.5">
                ( {days} jour{days > 1 ? "s" : ""} restant{days > 1 ? "s" : ""} )
              </p>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] font-semibold text-white bg-concours-navy px-2 py-0.5 rounded-full">Annonce</span>
                {!!c.postes && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">
                    <Briefcase className="w-3 h-3" /> {c.postes} poste{c.postes > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-50">
                Limite de dépôt : <span className="font-semibold text-gray-700">{formatDate(c.deadline)}</span>
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
