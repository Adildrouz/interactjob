import type { Metadata } from "next";
import ResultClient from "./ResultClient";

const BASE_URL = "https://www.interactjob.ma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Mon profil — Test de personnalité | InteractJob",
    description:
      "Découvrez mon profil de personnalité et les offres d'emploi compatibles sur InteractJob.",
    alternates: { canonical: `${BASE_URL}/test-personnalite/resultat/${id}` },
    robots: { index: false, follow: true },
    openGraph: {
      title: "Mon profil — Test de personnalité | InteractJob",
      description: "Découvrez mon profil de personnalité et les offres compatibles sur InteractJob.",
      type: "website",
      url: `${BASE_URL}/test-personnalite/resultat/${id}`,
      siteName: "InteractJob",
    },
  };
}

export default async function ResultatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Test de Personnalité", item: `${BASE_URL}/test-personnalite` },
      { "@type": "ListItem", position: 3, name: "Mon résultat", item: `${BASE_URL}/test-personnalite/resultat/${id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ResultClient id={id} />
    </>
  );
}
