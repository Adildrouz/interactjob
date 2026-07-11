import type { Metadata } from "next";
import Link from "next/link";
import PriceTag from "@/components/PriceTag";
import { ProfessionnelPageView, ProfessionnelCtaLink } from "./ProfessionnelTracking";

const BASE_URL = "https://www.interactjob.ma";
const NAVY = "#00347A";
const TURQ = "#00C2CB";

export const metadata: Metadata = {
  title: "Test de Personnalité Professionnel — Rapport Complet | InteractJob",
  description:
    "Obtenez un rapport de personnalité professionnel complet : PDF 10 pages, correspondance métiers, style de communication. Offre individuelle et pack entreprise.",
  alternates: { canonical: `${BASE_URL}/test-personnalite/professionnel` },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: "Test de Personnalité Professionnel — Rapport Complet | InteractJob",
    description: "Rapport PDF 10 pages, correspondance métiers et style de communication.",
    type: "website",
    url: `${BASE_URL}/test-personnalite/professionnel`,
    siteName: "InteractJob",
  },
};

const INCLUDED = [
  "Rapport PDF détaillé de 10 pages",
  "Analyse approfondie de votre profil",
  "Correspondance avec les métiers (career match)",
  "Votre style de communication",
  "Vos forces et axes de progression",
  "Recommandations de développement",
];

const B2B = [
  "Invitez vos candidats par un simple lien",
  "Tableau de bord de suivi des résultats",
  "Comparaison des profils d'équipe",
  "Export CSV des données",
  "Support dédié entreprise",
];

export default function ProfessionnelPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Test de Personnalité", item: `${BASE_URL}/test-personnalite` },
      { "@type": "ListItem", position: 3, name: "Professionnel", item: `${BASE_URL}/test-personnalite/professionnel` },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProfessionnelPageView />

      {/* Hero */}
      <section className="text-white" style={{ background: NAVY }}>
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">Test de Personnalité Professionnel</h1>
          <p className="mt-3 text-lg" style={{ color: TURQ }}>Un rapport complet pour piloter votre carrière ou votre équipe</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Free preview */}
        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: NAVY }}>Aperçu de votre rapport</h2>
          <div className="relative rounded-2xl border border-gray-200 bg-white p-6 overflow-hidden">
            <p className="text-gray-700 mb-3">
              Votre rapport professionnel synthétise votre profil de personnalité en un document
              clair et actionnable. Voici un aperçu de ce qu'il contient :
            </p>
            {/* Blurred locked section */}
            <div className="blur-sm select-none pointer-events-none space-y-2 text-gray-500">
              <p>• Profil dominant : analyse détaillée de votre type et de vos motivations profondes…</p>
              <p>• Style de communication : comment vous interagissez, vos préférences relationnelles…</p>
              <p>• Correspondance métiers : les 12 fonctions les plus alignées avec votre profil…</p>
              <p>• Plan de développement personnalisé sur 6 mois avec objectifs concrets…</p>
            </div>
            <div className="absolute inset-0 flex items-end justify-center pb-6 bg-gradient-to-t from-white via-white/70 to-transparent">
              <ProfessionnelCtaLink
                href="#individuel"
                tier="unlock_scroll"
                className="rounded-xl px-6 py-3 font-semibold text-white shadow-lg"
                style={{ background: TURQ }}
              >
                🔓 Débloquer mon rapport complet
              </ProfessionnelCtaLink>
            </div>
          </div>
        </section>

        {/* Individual tier */}
        <section id="individuel" className="rounded-2xl border-2 bg-white p-6" style={{ borderColor: NAVY }}>
          <h2 className="text-xl font-bold" style={{ color: NAVY }}>Offre individuelle</h2>
          <p className="mt-1 text-3xl font-extrabold" style={{ color: NAVY }}>
            <PriceTag type="individual" />
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            {INCLUDED.map((i) => <li key={i}>✅ {i}</li>)}
          </ul>
          <ProfessionnelCtaLink
            href="mailto:contact@interactjob.ma?subject=Rapport%20professionnel%20individuel"
            tier="individual"
            className="mt-6 block text-center rounded-xl px-6 py-3 font-semibold text-white"
            style={{ background: TURQ }}
          >
            Obtenir mon rapport complet — <PriceTag type="individual" />
          </ProfessionnelCtaLink>
        </section>

        {/* B2B tier */}
        <section className="rounded-2xl p-6 text-white" style={{ background: NAVY, border: `2px solid ${TURQ}` }}>
          <h2 className="text-xl font-bold">Pack entreprise</h2>
          <p className="mt-1 text-3xl font-extrabold" style={{ color: TURQ }}>
            <PriceTag type="pack" />
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/90">
            {B2B.map((i) => <li key={i}>⭐ {i}</li>)}
          </ul>
          <ProfessionnelCtaLink
            href="mailto:contact@interactjob.ma?subject=Pack%20entreprise%20test%20de%20personnalit%C3%A9"
            tier="pack"
            className="mt-6 block text-center rounded-xl px-6 py-3 font-semibold"
            style={{ background: TURQ, color: NAVY }}
          >
            Pack entreprise — <PriceTag type="pack" /> · Contactez-nous
          </ProfessionnelCtaLink>
        </section>

        <p className="text-center text-sm">
          <Link href="/test-personnalite" className="hover:underline" style={{ color: NAVY }}>
            ← Retour aux tests gratuits
          </Link>
        </p>
      </div>
    </div>
  );
}
