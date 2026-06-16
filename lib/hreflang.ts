const BASE_URL = "https://www.interactjob.ma";

/**
 * Build Next.js `alternates` metadata for a given FR-canonical path.
 * localePrefix "as-needed": FR has no prefix, EN = /en/..., AR = /ar/...
 *
 * Pass frPath with a leading slash, e.g. "/blog" or "/" for the home page.
 */
export function buildAlternates(frPath: string) {
  const canonical = `${BASE_URL}${frPath}`;
  const enPath = frPath === "/" ? "/en" : `/en${frPath}`;
  const arPath = frPath === "/" ? "/ar" : `/ar${frPath}`;

  return {
    canonical,
    languages: {
      fr: canonical,
      en: `${BASE_URL}${enPath}`,
      ar: `${BASE_URL}${arPath}`,
      "x-default": canonical,
    },
  };
}
