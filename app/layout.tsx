import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const BASE_URL = "https://interactjob.ma";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "InteractJob – Trouvez l'emploi de vos rêves au Maroc",
    template: "%s | InteractJob",
  },
  description:
    "InteractJob est la plateforme d'emploi #1 au Maroc. Trouvez les meilleures offres CDI, CDD et Stage à Casablanca, Rabat, Marrakech et partout au Maroc.",
  keywords: [
    "emploi maroc",
    "offres d'emploi maroc",
    "recrutement maroc",
    "jobs casablanca",
    "CDI maroc",
    "stage maroc",
    "rekrute",
    "emploi.ma",
    "interactjob",
  ],
  authors: [{ name: "InteractJob", url: BASE_URL }],
  creator: "InteractJob",
  publisher: "InteractJob",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "fr_MA",
    url: BASE_URL,
    siteName: "InteractJob",
    title: "InteractJob – Trouvez l'emploi de vos rêves au Maroc",
    description:
      "La plateforme d'emploi dédiée au marché marocain. CDI, CDD, Stage dans toutes les villes du Maroc.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InteractJob – Emploi au Maroc",
    description: "Trouvez votre prochain emploi au Maroc avec InteractJob.",
  },
  alternates: { canonical: BASE_URL },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "InteractJob",
  url: BASE_URL,
  logo: `${BASE_URL}/InteractJob-Logo.png`,
  sameAs: ["https://www.linkedin.com/company/interact-job/"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@interactjob.ma",
    contactType: "customer service",
    availableLanguage: ["French", "Arabic"],
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "InteractJob",
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/offres?keyword={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      {/* suppressHydrationWarning: browser extensions (e.g. Titans) inject attributes into <body> causing hydration mismatch */}
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
