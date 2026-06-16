import type { Metadata } from 'next';
import CVGeneratorClient from './CVGeneratorClient';

const BASE_URL = 'https://www.interactjob.ma';

export const metadata: Metadata = {
  title: 'Générateur CV IA 2026 | InteractJob',
  description:
    'Créez votre CV professionnel en 3 minutes avec notre IA. 25 modèles optimisés ATS, lettre de motivation et email de candidature inclus. Seulement 5€, adapté au marché marocain.',
  keywords: [
    'générateur cv maroc',
    'créer cv maroc',
    'cv ia maroc',
    'cv professionnel maroc',
    'modèle cv maroc 2026',
    'cv ats maroc',
    'lettre motivation maroc',
    'cv casablanca rabat',
  ],
  openGraph: {
    title: 'Générateur CV IA 2026 | InteractJob',
    description: 'Créez votre CV professionnel en 3 minutes. 25 modèles, lettre de motivation, optimisé ATS. Seulement 5€.',
    type: 'website',
    url: `${BASE_URL}/generateur-cv`,
    siteName: 'InteractJob',
  },
  alternates: { canonical: `${BASE_URL}/generateur-cv` },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
    { "@type": "ListItem", position: 2, name: "Générateur CV IA", item: `${BASE_URL}/generateur-cv` },
  ],
};

export default function GenerateurCVPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CVGeneratorClient />
    </>
  );
}
