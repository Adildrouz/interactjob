import type { Metadata } from "next";
import { Link } from "@/i18n/routing";
import concoursData from "@/data/concours.json";
import { Concours } from "@/types";
import { buildFrOnlyAlternates } from "@/lib/hreflang";
import { isExpired } from "@/lib/concours";
import ArchivesExplorer from "./ArchivesExplorer";

const allConcours = concoursData as Concours[];

export const metadata: Metadata = {
  title: "Archives des Concours Fonction Publique Maroc — Concours Clôturés",
  description: "Historique complet des concours de recrutement de la fonction publique marocaine déjà clôturés : ministères, collectivités, établissements publics.",
  alternates: buildFrOnlyAlternates("/concours/archives"),
  keywords: ["archives concours fonction publique maroc", "concours clôturés maroc", "historique concours administration"],
};

export default function ConcoursArchivesPage() {
  const expired = allConcours
    .filter((c) => isExpired(c.deadline))
    .sort((a, b) => new Date(b.deadline!).getTime() - new Date(a.deadline!).getTime());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary">Accueil</Link>
        <span>/</span>
        <Link href="/concours" className="hover:text-primary">Concours</Link>
        <span>/</span>
        <span className="text-gray-600">Archives</span>
      </nav>

      <div className="mb-8">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Fonction Publique</span>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Archives des Concours Clôturés</h1>
        <p className="text-gray-500 mt-2">
          {expired.length} concours clôturés — historique complet des avis de recrutement publics au Maroc.
        </p>
        <Link href="/concours" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-3">
          ← Retour aux concours actifs
        </Link>
      </div>

      <ArchivesExplorer expired={expired} />
    </div>
  );
}
