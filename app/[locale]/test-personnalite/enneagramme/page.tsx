import type { Metadata } from "next";
import EnneagrammeClient from "./EnneagrammeClient";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  title: "Test Ennéagramme Gratuit — Découvrez votre type | InteractJob",
  description:
    "Test de l'ennéagramme gratuit en 12 minutes. 45 questions pour découvrir lequel des 9 types de l'ennéagramme vous correspond, vos ailes et votre chemin de croissance.",
  alternates: { canonical: `${BASE_URL}/test-personnalite/enneagramme` },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: "Test Ennéagramme Gratuit — Découvrez votre type | InteractJob",
    description: "45 questions pour découvrir votre type d'ennéagramme parmi les 9 profils.",
    type: "website",
    url: `${BASE_URL}/test-personnalite/enneagramme`,
    siteName: "InteractJob",
  },
};

export default function EnneagrammePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Test de Personnalité", item: `${BASE_URL}/test-personnalite` },
      { "@type": "ListItem", position: 3, name: "Ennéagramme", item: `${BASE_URL}/test-personnalite/enneagramme` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <EnneagrammeClient />
    </>
  );
}
