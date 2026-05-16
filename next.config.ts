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
    ];
  },
};

export default withNextIntl(nextConfig);
