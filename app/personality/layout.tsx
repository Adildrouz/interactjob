import type { Metadata } from 'next';

const BASE_URL = 'https://www.interactjob.ma';

export const metadata: Metadata = {
  title: 'Test de Personnalité Professionnel Gratuit — Emploi Maroc 2026 | InteractJob',
  description: 'Découvrez votre profil de personnalité professionnel en 10 minutes. Test gratuit inspiré du modèle DISC, adapté au marché de l\'emploi marocain. Rapport IA personnalisé. Utilisé par des candidats à Casablanca, Rabat, Marrakech.',
  keywords: [
    'test de personnalité maroc',
    'test personnalité emploi maroc',
    'test personnalité professionnel gratuit',
    'test personnalité recrutement maroc',
    'profil personnalité maroc',
    'MBTI maroc gratuit',
    'test DISC maroc',
    'personnalité professionnelle maroc',
    'bilan de compétences maroc',
    'test personnalité carrière maroc',
  ],
  openGraph: {
    title: 'Test de Personnalité Professionnel Gratuit — Emploi Maroc | InteractJob',
    description: 'Découvrez votre identité professionnelle en 10 minutes. Test comportemental gratuit adapté au marché marocain. Rapport IA carrière inclus.',
    type: 'website',
    url: `${BASE_URL}/personality`,
    siteName: 'InteractJob',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Test de Personnalité Professionnel Gratuit — Maroc 2026',
    description: 'Test comportemental en 10 min. Rapport IA carrière gratuit. Adapté au marché de l\'emploi marocain.',
  },
  alternates: {
    canonical: `${BASE_URL}/personality`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function PersonalityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {children}
    </div>
  );
}
