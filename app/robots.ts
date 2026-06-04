import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /en/ and /ar/ are no longer blocked here — noindex is set via meta tags
        // in the locale layout, which is the correct signal for Google.
        // Blocking with robots.txt causes "Indexed though blocked by robots.txt" warnings.
        disallow: [
          "/api/",
          "/admin/",
        ],
      },
      // AI crawlers — allow everything
      { userAgent: "GPTBot",              allow: "/" },
      { userAgent: "ChatGPT-User",        allow: "/" },
      { userAgent: "OAI-SearchBot",       allow: "/" },
      { userAgent: "ClaudeBot",           allow: "/" },
      { userAgent: "anthropic-ai",        allow: "/" },
      { userAgent: "Claude-Web",          allow: "/" },
      { userAgent: "PerplexityBot",       allow: "/" },
      { userAgent: "Google-Extended",     allow: "/" },
      { userAgent: "Googlebot-Extended",  allow: "/" },
      { userAgent: "meta-externalagent",  allow: "/" },
      { userAgent: "Bytespider",          allow: "/" },
      { userAgent: "CCBot",               allow: "/" },
      { userAgent: "cohere-ai",           allow: "/" },
      { userAgent: "Applebot-Extended",   allow: "/" },
      { userAgent: "YouBot",              allow: "/" },
      { userAgent: "BraveBot",            allow: "/" },
    ],
    sitemap: ["https://www.interactjob.ma/sitemap.xml"],
    host: "https://www.interactjob.ma",
  };
}
