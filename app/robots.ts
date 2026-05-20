import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // General crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      // OpenAI
      { userAgent: "GPTBot",        allow: "/" },
      { userAgent: "ChatGPT-User",  allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      // Anthropic
      { userAgent: "ClaudeBot",           allow: "/" },
      { userAgent: "anthropic-ai",        allow: "/" },
      { userAgent: "Claude-Web",          allow: "/" },
      // Perplexity
      { userAgent: "PerplexityBot", allow: "/" },
      // Google AI
      { userAgent: "Google-Extended",    allow: "/" },
      { userAgent: "Googlebot-Extended", allow: "/" },
      // Meta / Bytedance / Cohere / Apple
      { userAgent: "meta-externalagent",   allow: "/" },
      { userAgent: "Bytespider",           allow: "/" },
      { userAgent: "CCBot",                allow: "/" },
      { userAgent: "cohere-ai",            allow: "/" },
      { userAgent: "Applebot-Extended",    allow: "/" },
      // YouBot / Brave
      { userAgent: "YouBot",    allow: "/" },
      { userAgent: "BraveBot",  allow: "/" },
    ],
    sitemap: [
      "https://www.interactjob.ma/sitemap.xml",
      "https://www.interactjob.ma/sitemap-jobs.xml",
      "https://www.interactjob.ma/sitemap-blog.xml",
      "https://www.interactjob.ma/sitemap-pages.xml",
    ],
    host: "https://www.interactjob.ma",
  };
}
