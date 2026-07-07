"use client";

import { Link } from "@/i18n/routing";
import { Building2, Briefcase, Hourglass, CalendarDays, Bell } from "lucide-react";
import { Concours } from "@/types";
import { formatDate, isExpiringSoon, inferOnlineSubmission } from "@/lib/concours";
import { trackEvent } from "@/lib/trackEvent";
import OrganismeCrest from "./OrganismeCrest";

function scrollToAlerts(e: React.MouseEvent, slug: string) {
  e.preventDefault();
  e.stopPropagation();
  trackEvent("concours_bell_click", { slug });
  document.getElementById("concours-alerts")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export default function ConcoursCard({ concours: c }: { concours: Concours }) {
  const expiring = isExpiringSoon(c.deadline, 7);
  const online = inferOnlineSubmission(c);

  return (
    <Link
      href={`/concours/${c.slug}` as any}
      onClick={() => trackEvent("concours_card_click", { slug: c.slug })}
      className={`group block bg-white rounded-2xl border ${expiring ? "border-orange-200" : "border-concours-border"} shadow-sm p-5 hover:shadow-lg hover:border-concours-navy transition-all`}
    >
      <div className="flex items-start gap-3">
        <OrganismeCrest name={c.organization_fr} />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-concours-navy text-sm leading-snug line-clamp-2">
            {c.title_fr}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-1.5">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{c.organization_fr}</span>
          </p>
        </div>
        <button
          onClick={(e) => scrollToAlerts(e, c.slug)}
          aria-label="Créer une alerte pour ce concours"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-concours-turquoise hover:bg-concours-bg transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className="text-xs font-semibold text-white bg-concours-navy px-2.5 py-1 rounded-full">
          Annonce
        </span>
        {online && (
          <span className="text-xs font-semibold text-concours-turquoise border border-concours-turquoise px-2.5 py-1 rounded-full">
            Dépôt en ligne
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
        {!!c.postes && (
          <p className="flex items-center gap-2 text-xs text-gray-600">
            <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            {c.postes} poste{c.postes > 1 ? "s" : ""}
          </p>
        )}
        {c.deadline && (
          <p className={`flex items-center gap-2 text-xs ${expiring ? "text-orange-600 font-semibold" : "text-gray-600"}`}>
            <Hourglass className="w-3.5 h-3.5 flex-shrink-0" />
            Limite de dépôt : {formatDate(c.deadline)}
          </p>
        )}
        {c.date_concours && (
          <p className="flex items-center gap-2 text-xs text-gray-600">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            Date du concours : {formatDate(c.date_concours)}
          </p>
        )}
      </div>
    </Link>
  );
}
