"use client";

import { useState } from "react";
import TrackedLink from "@/components/TrackedLink";
import ConcoursAlertForm from "@/components/ConcoursAlertForm";
import { Concours } from "@/types";
import { CONCOURS_NIVEAUX, matchesNiveau } from "@/lib/concours";
import { trackEvent } from "@/lib/trackEvent";

export default function ConversionCTAs({ active, onCheckEligibility }: { active: Concours[]; onCheckEligibility: (niveau: string) => void }) {
  const [niveau, setNiveau] = useState<string>("");

  const matchCount = niveau ? active.filter((c) => matchesNiveau(c, niveau)).length : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
      {/* Préparez votre candidature */}
      <section className="rounded-2xl p-6 text-white flex flex-col" style={{ background: "linear-gradient(135deg, #00347A 0%, #001F4D 100%)" }}>
        <h2 className="text-base font-bold mb-2">Préparez votre candidature</h2>
        <p className="text-blue-100 text-xs leading-relaxed mb-4 flex-1">
          Un CV optimisé et un dossier complet font toute la différence lors de la présélection.
        </p>
        <div className="flex flex-col gap-2">
          <TrackedLink
            href={"/cv-checker" as any}
            event="concours_cta_click"
            eventParams={{ cta: "cv_checker", page: "listing" }}
            className="inline-flex items-center justify-center gap-2 bg-white text-concours-navy font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
          >
            ✅ Vérifiez votre CV gratuitement
          </TrackedLink>
          <TrackedLink
            href={"/generateur-cv" as any}
            event="concours_cta_click"
            eventParams={{ cta: "generateur_cv", page: "listing" }}
            className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold px-4 py-2.5 rounded-xl text-sm border border-white/30 transition-colors"
          >
            🤖 Créer mon CV IA — 5€
          </TrackedLink>
        </div>
      </section>

      {/* Alertes email */}
      <section id="concours-alerts" className="rounded-2xl scroll-mt-20">
        <ConcoursAlertForm />
      </section>

      {/* Calculez votre éligibilité */}
      <section className="bg-white rounded-2xl border border-concours-border p-6 flex flex-col">
        <h2 className="text-base font-bold text-concours-navy mb-2">Calculez votre éligibilité</h2>
        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          Sélectionnez votre niveau de diplôme pour voir combien de concours ouverts correspondent à votre profil.
        </p>
        <select
          value={niveau}
          onChange={(e) => { setNiveau(e.target.value); trackEvent("concours_eligibility_check", { niveau: e.target.value }); }}
          className="border border-concours-border rounded-lg px-3 py-2.5 text-sm text-gray-700 mb-3 focus:outline-none focus:ring-2 focus:ring-concours-turquoise/30"
        >
          <option value="">Votre niveau de diplôme…</option>
          {CONCOURS_NIVEAUX.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {matchCount !== null && (
          <p className="text-sm text-gray-700 mb-3">
            <span className="font-extrabold text-concours-green text-lg">{matchCount}</span> concours ouvert{matchCount > 1 ? "s" : ""} correspond{matchCount > 1 ? "ent" : ""} à votre profil.
          </p>
        )}
        <button
          disabled={!niveau}
          onClick={() => onCheckEligibility(niveau)}
          className="mt-auto inline-flex items-center justify-center gap-2 bg-concours-navy disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:brightness-110 transition-all"
        >
          Voir ces concours
        </button>
      </section>
    </div>
  );
}
