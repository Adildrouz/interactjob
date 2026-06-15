import type { Metadata } from "next";
import CouleursClient from "./CouleursClient";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  title: "Test Personnalité Couleurs — Rouge Bleu Vert Jaune | InteractJob",
  description:
    "Test des couleurs gratuit en 8 minutes. Découvrez si vous êtes Rouge, Bleu, Vert ou Jaune et votre style de management et de communication.",
  alternates: { canonical: `${BASE_URL}/test-personnalite/couleurs` },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: "Test Personnalité Couleurs — Rouge Bleu Vert Jaune | InteractJob",
    description: "Rouge, Bleu, Vert ou Jaune : découvrez votre couleur dominante en 8 minutes.",
    type: "website",
    url: `${BASE_URL}/test-personnalite/couleurs`,
    siteName: "InteractJob",
  },
};

export default function CouleursPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Test de Personnalité", item: `${BASE_URL}/test-personnalite` },
      { "@type": "ListItem", position: 3, name: "Couleurs", item: `${BASE_URL}/test-personnalite/couleurs` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CouleursClient />
    </>
  );
}
