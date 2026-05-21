import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test de Personnalité IA — InteractJob',
  description: 'Découvrez votre profil comportemental au travail en 10 minutes. Rapport IA gratuit + rapport premium détaillé.',
  openGraph: {
    title: 'Test de Personnalité IA — InteractJob',
    description: 'Découvrez votre identité professionnelle avec notre test comportemental inspiré du modèle DISC.',
    type: 'website',
  },
};

export default function PersonalityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {children}
    </div>
  );
}
