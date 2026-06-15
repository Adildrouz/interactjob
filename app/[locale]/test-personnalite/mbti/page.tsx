import type { Metadata } from "next";
import MBTIClient from "./MBTIClient";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  title: "Test MBTI Gratuit — Découvrez vos 16 personnalités | InteractJob",
  description:
    "Passez le test MBTI gratuit en 15 minutes. 60 questions pour découvrir lequel des 16 types de personnalité vous correspond et les métiers compatibles.",
  alternates: { canonical: `${BASE_URL}/test-personnalite/mbti` },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: "Test MBTI Gratuit — Découvrez vos 16 personnalités | InteractJob",
    description: "60 questions pour découvrir votre type MBTI et les métiers qui vous correspondent.",
    type: "website",
    url: `${BASE_URL}/test-personnalite/mbti`,
    siteName: "InteractJob",
  },
};

const FAQ = [
  { q: "Le test MBTI est-il gratuit ?", a: "Oui, le test MBTI sur InteractJob est entièrement gratuit et sans inscription." },
  { q: "Combien de questions comporte le test ?", a: "60 questions réparties sur les 4 dichotomies du MBTI (E/I, S/N, T/F, J/P)." },
  { q: "Combien de temps faut-il ?", a: "Environ 15 minutes. Répondez spontanément pour un résultat fiable." },
];

export default function MBTIPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "Quiz",
      name: "Test de personnalité MBTI",
      about: { "@type": "Thing", name: "Indicateur typologique Myers-Briggs" },
      educationalLevel: "beginner",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: "Test de Personnalité", item: `${BASE_URL}/test-personnalite` },
        { "@type": "ListItem", position: 3, name: "MBTI", item: `${BASE_URL}/test-personnalite/mbti` },
      ],
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MBTIClient />
    </>
  );
}
