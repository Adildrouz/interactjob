import type { Metadata } from "next";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  title: "CV Checker — Analysez et optimisez votre CV gratuitement | InteractJob",
  description: "Analysez votre CV en ligne gratuitement. Obtenez un score, des recommandations personnalisées et optimisez votre candidature pour le marché de l'emploi marocain.",
  keywords: ["cv checker maroc", "analyser cv gratuit", "score cv", "optimiser cv maroc", "vérifier cv", "cv professionnel maroc"],
  alternates: { canonical: `${BASE_URL}/cv-checker` },
  openGraph: {
    title: "CV Checker Gratuit — Analysez votre CV | InteractJob",
    description: "Analysez votre CV en quelques secondes : score, points forts, axes d'amélioration. Gratuit et adapté au marché marocain.",
    url: `${BASE_URL}/cv-checker`,
    type: "website",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Le CV Checker InteractJob est-il gratuit ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, le CV Checker InteractJob est entièrement gratuit. Téléchargez votre CV en PDF, DOCX ou TXT et obtenez immédiatement un score et des recommandations personnalisées.",
      },
    },
    {
      "@type": "Question",
      name: "Quels formats de CV sont acceptés par le CV Checker ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le CV Checker accepte les fichiers PDF, DOCX (Word), DOC et TXT. La taille maximale recommandée est de 5 MB.",
      },
    },
    {
      "@type": "Question",
      name: "Comment est calculé le score de mon CV ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le score est calculé sur 100 points en analysant plusieurs critères : longueur et structure du CV, présence de mots-clés, utilisation de verbes d'action, présence des coordonnées, et contenu des sections expérience/formation/compétences.",
      },
    },
    {
      "@type": "Question",
      name: "Mes données de CV sont-elles conservées ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Non. L'analyse est réalisée entièrement dans votre navigateur. Aucun fichier n'est envoyé à nos serveurs. Vos données restent confidentielles.",
      },
    },
  ],
};

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CV Checker — InteractJob",
  description: "Outil gratuit d'analyse et de scoring de CV pour le marché de l'emploi marocain",
  url: `${BASE_URL}/cv-checker`,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "MAD",
  },
  provider: {
    "@type": "Organization",
    name: "InteractJob",
    url: BASE_URL,
  },
};

export default function CvCheckerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      {children}
    </>
  );
}
