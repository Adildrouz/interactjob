"use client";

import { useState } from "react";
import { OrganismeSummary } from "@/lib/concours";
import { trackEvent } from "@/lib/trackEvent";
import OrganismeCrest from "./OrganismeCrest";

const INITIAL_COUNT = 9;

export default function AdministrationsGrid({ organismes, onConsulter }: { organismes: OrganismeSummary[]; onConsulter: (name: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? organismes : organismes.slice(0, INITIAL_COUNT);

  if (organismes.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-concours-navy mb-1">Les administrations qui recrutent</h2>
      <p className="text-sm text-gray-500 mb-4">{organismes.length} organismes publient actuellement des concours ouverts.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((org) => (
          <div key={org.name} className="bg-white rounded-2xl border border-concours-border p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <OrganismeCrest name={org.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{org.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{org.count} concours ouvert{org.count > 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { onConsulter(org.name); trackEvent("concours_org_consult_click", { organisme: org.name }); }}
                className="flex-1 text-xs font-semibold text-concours-navy border border-concours-navy rounded-lg py-2 hover:bg-concours-bg transition-colors"
              >
                Consulter les annonces
              </button>
              <button
                onClick={() => {
                  trackEvent("concours_org_alert_click", { organisme: org.name });
                  document.getElementById("concours-alerts")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="flex-1 text-xs font-semibold text-white bg-concours-navy rounded-lg py-2 hover:brightness-110 transition-all"
              >
                Créer une alerte
              </button>
            </div>
          </div>
        ))}
      </div>

      {!expanded && organismes.length > INITIAL_COUNT && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-4 w-full text-center text-sm font-semibold text-concours-navy bg-white border border-concours-border rounded-xl py-3 hover:bg-concours-bg transition-colors"
        >
          Voir toutes les administrations ({organismes.length})
        </button>
      )}
    </section>
  );
}
