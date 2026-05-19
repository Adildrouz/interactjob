import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

const BASE_URL = "https://www.interactjob.ma";

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
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
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
    email: "jobinteract@gmail.com",
    contactType: "customer service",
    availableLanguage: ["French", "Arabic", "English"],
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
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <meta name="google-adsense-account" content="ca-pub-9841483299411545" />
        <link rel="alternate" type="application/rss+xml" title="Offres d'emploi — InteractJob.ma" href={`${BASE_URL}/rss.xml`} />
        <link rel="alternate" type="application/rss+xml" title="Blog Emploi — InteractJob.ma" href={`${BASE_URL}/blog-rss.xml`} />

        {/* Preconnect to third-party origins to reduce LCP/FID */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />

        {/* Google AdSense — doit être dans <head> pour la vérification du site */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9841483299411545"
          crossOrigin="anonymous"
        />

        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-X6V5JSFVZE"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-X6V5JSFVZE');
          `}
        </Script>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>

      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />

      </body>
    </html>
  );
}