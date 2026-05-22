import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";

const BASE_URL = "https://www.interactjob.ma";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "InteractJob â€“ Trouvez l'emploi de vos rÃªves au Maroc",
    template: "%s | InteractJob",
  },
  description:
    "InteractJob est la plateforme d'emploi #1 au Maroc. Trouvez les meilleures offres CDI, CDD et Stage Ã  Casablanca, Rabat, Marrakech et partout au Maroc.",
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
    title: "InteractJob â€“ Trouvez l'emploi de vos rÃªves au Maroc",
    description:
      "La plateforme d'emploi dÃ©diÃ©e au marchÃ© marocain. CDI, CDD, Stage dans toutes les villes du Maroc.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InteractJob â€“ Emploi au Maroc",
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
  sameAs: [
    "https://www.linkedin.com/company/interact-job/",
    "https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@interactjob.ma",
    contactType: "customer service",
    availableLanguage: ["French", "Arabic", "English"],
  },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${BASE_URL}/#local-business`,
  name: "InteractJob",
  description: "Plateforme d'emploi #1 au Maroc â€” CDI, CDD, Stage, Remote et Concours",
  url: BASE_URL,
  logo: `${BASE_URL}/InteractJob-Logo.png`,
  email: "contact@interactjob.ma",
  address: {
    "@type": "PostalAddress",
    addressCountry: "MA",
    addressRegion: "Casablanca-Settat",
    addressLocality: "Casablanca",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 33.5731,
    longitude: -7.5898,
  },
  areaServed: {
    "@type": "Country",
    name: "Morocco",
  },
  priceRange: "Gratuit",
  openingHours: "Mo-Su 00:00-24:00",
  sameAs: ["https://www.linkedin.com/company/interact-job/"],
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
        <link rel="alternate" type="application/rss+xml" title="Offres d'emploi â€” InteractJob.ma" href={`${BASE_URL}/rss.xml`} />
        <link rel="alternate" type="application/rss+xml" title="Blog Emploi â€” InteractJob.ma" href={`${BASE_URL}/blog-rss.xml`} />

        {/* Preconnect to third-party origins to reduce LCP/FID */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />

        {/* Google AdSense â€” doit Ãªtre dans <head> pour la vÃ©rification du site */}
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

            gtag('config', 'G-X6V5JSFVZE', {
              custom_map: { dimension1: 'traffic_source_type' }
            });

            // Classify AI referral traffic
            (function() {
              var ref = document.referrer || '';
              var ua  = navigator.userAgent || '';
              var aiSources = [
                { pattern: 'chat.openai.com',    label: 'ChatGPT'    },
                { pattern: 'chatgpt.com',         label: 'ChatGPT'    },
                { pattern: 'perplexity.ai',       label: 'Perplexity' },
                { pattern: 'claude.ai',           label: 'Claude'     },
                { pattern: 'bard.google.com',     label: 'GoogleBard' },
                { pattern: 'gemini.google.com',   label: 'Gemini'     },
                { pattern: 'copilot.microsoft.com', label: 'Copilot'  },
                { pattern: 'you.com',             label: 'YouAI'      },
                { pattern: 'phind.com',           label: 'Phind'      },
              ];
              var aiUABots = ['GPTBot','ChatGPT-User','ClaudeBot','PerplexityBot',
                              'Google-Extended','Bytespider','CCBot','anthropic-ai'];

              var sourceLabel = null;
              for (var i = 0; i < aiSources.length; i++) {
                if (ref.indexOf(aiSources[i].pattern) !== -1) {
                  sourceLabel = aiSources[i].label;
                  break;
                }
              }
              if (!sourceLabel) {
                for (var j = 0; j < aiUABots.length; j++) {
                  if (ua.indexOf(aiUABots[j]) !== -1) {
                    sourceLabel = 'AI-Crawler';
                    break;
                  }
                }
              }
              if (sourceLabel) {
                gtag('event', 'ai_referral', {
                  event_category: 'AI Traffic',
                  event_label: sourceLabel,
                  traffic_source_type: sourceLabel,
                });
              }
            })();
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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />

        <link rel="alternate" type="application/rss+xml" title="Offres Remote â€” InteractJob.ma" href={`${BASE_URL}/remote-rss.xml`} />
      </head>

      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />

      </body>
    </html>
  );
}
