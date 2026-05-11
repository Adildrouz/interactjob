import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code du travail marocain – Articles & Droits | InteractJob",
  description:
    "Consultez les articles clés du Code du travail du Maroc (Loi n° 65-99) : licenciement, SMIG, congés, préavis, maternité, syndicats. Recherchez par thème ou mot-clé.",
  keywords: [
    "code du travail maroc",
    "droit du travail maroc",
    "licenciement maroc",
    "SMIG maroc",
    "congés payés maroc",
    "préavis maroc",
    "loi 65-99",
  ],
  openGraph: {
    title: "Code du travail marocain | InteractJob",
    description:
      "Tous les articles clés du Code du travail du Maroc expliqués simplement.",
    url: "https://www.interactjob.ma/code-travail",
    type: "website",
    siteName: "InteractJob",
  },
  alternates: {
    canonical: "https://www.interactjob.ma/code-travail",
    languages: {
      fr: "https://www.interactjob.ma/code-travail",
      en: "https://www.interactjob.ma/en/code-travail",
      ar: "https://www.interactjob.ma/ar/code-travail",
    },
  },
};

export default function CodeTravailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
