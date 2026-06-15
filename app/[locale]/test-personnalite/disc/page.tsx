import type { Metadata } from "next";
import DISCClient from "./DISCClient";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  title: "Test DISC Gratuit — Découvrez votre profil DISC | InteractJob",
  description:
    "Test DISC gratuit en 10 minutes. 24 questions pour découvrir votre profil Dominant, Influent, Stable ou Consciencieux et ses applications professionnelles.",
  alternates: { canonical: `${BASE_URL}/test-personnalite/disc` },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: "Test DISC Gratuit — Découvrez votre profil DISC | InteractJob",
    description: "Dominant, Influent, Stable ou Consciencieux : découvrez votre profil DISC en 10 minutes.",
    type: "website",
    url: `${BASE_URL}/test-personnalite/disc`,
    siteName: "InteractJob",
  },
};

export default function DISCPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Test de Personnalité", item: `${BASE_URL}/test-personnalite` },
      { "@type": "ListItem", position: 3, name: "DISC", item: `${BASE_URL}/test-personnalite/disc` },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DISCClient />
    </>
  );
}
