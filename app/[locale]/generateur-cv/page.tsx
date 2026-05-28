import type { Metadata } from 'next';
import CVGeneratorClient from './CVGeneratorClient';

const BASE_URL = 'https://www.interactjob.ma';

export const metadata: Metadata = {
  title: 'Générateur CV IA Gratuit — Maroc 2026 | InteractJob',
  description:
    'Créez votre CV professionnel en 3 minutes avec notre IA. 25 modèles optimisés ATS, lettre de motivation et email de candidature inclus. 100% gratuit, adapté au marché marocain.',
  keywords: [
    'générateur cv maroc',
    'créer cv gratuit maroc',
    'cv ia maroc',
    'cv professionnel maroc gratuit',
    'modèle cv maroc 2026',
    'cv ats maroc',
    'lettre motivation maroc',
    'cv casablanca rabat',
  ],
  openGraph: {
    title: 'Générateur CV IA Gratuit — Maroc 2026 | InteractJob',
    description: 'Créez votre CV professionnel en 3 minutes. 25 modèles, lettre de motivation, optimisé ATS. 100% gratuit.',
    type: 'website',
    url: `${BASE_URL}/generateur-cv`,
    siteName: 'InteractJob',
  },
  alternates: { canonical: `${BASE_URL}/generateur-cv` },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function GenerateurCVPage() {
  return <CVGeneratorClient />;
}
