import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import CVGeneratorClient from './CVGeneratorClient';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Générateur CV IA Gratuit — InteractJob',
    description:
      'Créez votre CV professionnel optimisé ATS en quelques minutes. 25 modèles, lettre de motivation et email de candidature générés par IA. 100% gratuit.',
    robots: { index: true, follow: true },
  };
}

export default function GenerateurCVPage() {
  return <CVGeneratorClient />;
}
