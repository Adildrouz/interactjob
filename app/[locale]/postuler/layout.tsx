import type { Metadata } from 'next';

const BASE_URL = 'https://www.interactjob.ma';

export const metadata: Metadata = {
  title: "Déposer ma Candidature Spontanée au Maroc | InteractJob.ma",
  description:
    "Soumettez votre candidature spontanée sur InteractJob.ma. Indiquez votre ville, secteur et niveau d'expérience — nous vous contacterons dès qu'une offre correspond à votre profil au Maroc.",
  keywords: [
    'candidature spontanée maroc',
    'postuler emploi maroc',
    'déposer cv maroc',
    'recherche emploi maroc 2027',
  ],
  alternates: { canonical: `${BASE_URL}/postuler` },
  openGraph: {
    title: "Déposer ma Candidature Spontanée | InteractJob.ma",
    description:
      "Soumettez votre candidature sur InteractJob.ma et soyez contacté dès qu'une offre correspond à votre profil.",
    url: `${BASE_URL}/postuler`,
    siteName: 'InteractJob.ma',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function PostulerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
