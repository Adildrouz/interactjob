import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
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
