import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose'],
  async headers() {
    return [
      {
        // Cache Next.js built assets (hashed filenames) forever
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache public images and favicon
        source: "/:file(InteractJob-Logo\\.png|favicon\\.png|favicon\\.ico)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        // Cache RSS feeds
        source: "/rss.xml",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/blog-rss.xml",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // non-www → www (301 permanent)
      {
        source: "/:path*",
        has: [{ type: "host", value: "interactjob.ma" }],
        destination: "https://www.interactjob.ma/:path*",
        permanent: true,
      },
      // Old singular /offre/:slug → /offres/:slug
      {
        source: "/offre/:slug",
        destination: "/offres/:slug",
        permanent: true,
      },
      // Old /emploi/* and /jobs/* patterns → /offres
      {
        source: "/emploi/:path*",
        destination: "/offres",
        permanent: true,
      },
      {
        source: "/jobs/:path*",
        destination: "/offres",
        permanent: true,
      },
      {
        source: "/job/:path*",
        destination: "/offres",
        permanent: true,
      },
      // Old /article/* → /blog
      {
        source: "/article/:slug",
        destination: "/blog/:slug",
        permanent: true,
      },
      // /fr/* → /* (fr is default locale, no prefix needed)
      {
        source: "/fr/:path*",
        destination: "/:path*",
        permanent: true,
      },
      // LinkedIn-shared URLs where enricher regenerated the slug after sharing
      {
        source: "/offres/asd-ma-tassil-wa-tatabbou-talab-addam-alijtimaii-almubachir",
        destination: "/offres/asdma-maroc",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
