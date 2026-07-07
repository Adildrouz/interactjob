"use client";

import { Search } from "lucide-react";
import { ANNONCE_TYPES } from "@/lib/concours";

interface HeroSearchProps {
  query: string;
  onQueryChange: (v: string) => void;
  annonceType: string;
  onAnnonceTypeChange: (v: string) => void;
  resultCount: number;
  onSubmit: () => void;
}

export default function HeroSearch({ query, onQueryChange, annonceType, onAnnonceTypeChange, resultCount, onSubmit }: HeroSearchProps) {
  return (
    <section
      className="relative w-full px-4 sm:px-6 lg:px-8 py-14 sm:py-20 overflow-hidden"
      style={{ background: "linear-gradient(135deg, #00347A 0%, #001F4D 100%)" }}
    >
      {/* subtle decorative pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, #00C2CB 0%, transparent 45%), radial-gradient(circle at 80% 80%, #00C2CB 0%, transparent 45%)",
        }}
      />
      <div className="relative max-w-4xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-concours-turquoise mb-3">
          Fonction Publique Marocaine
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
          PORTAIL DES CONCOURS PUBLICS AU MAROC
        </h1>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          className="bg-white rounded-2xl shadow-xl p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch gap-2"
        >
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Mots-clés : poste, ministère, ville…"
              className="w-full py-2.5 text-sm text-gray-900 focus:outline-none"
            />
          </div>
          <div className="sm:border-l border-gray-100 sm:pl-2">
            <select
              value={annonceType}
              onChange={(e) => onAnnonceTypeChange(e.target.value)}
              className="w-full sm:w-auto h-full px-3 py-2.5 text-sm text-gray-700 bg-transparent focus:outline-none rounded-lg"
            >
              <option value="Tous">Tous types d&apos;annonce</option>
              {ANNONCE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-concours-turquoise hover:brightness-95 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap"
          >
            Rechercher
          </button>
        </form>

        <p className="text-blue-100 text-xs mt-3">
          {resultCount} concours actif{resultCount > 1 ? "s" : ""} — résultats filtrés instantanément, sans rechargement de page.
        </p>
      </div>
    </section>
  );
}
