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

/**
 * For sections whose content is inherently FR/AR with no real English
 * translation (e.g. /concours — Moroccan public-sector listings sourced
 * verbatim). The /en/... and /ar/... URLs still render (same content,
 * useful for users who land there), but canonical always points at the
 * FR master and no fake per-language alternate is declared.
 */
export function buildFrOnlyAlternates(frPath: string) {
  const canonical = `${BASE_URL}${frPath}`;
  return {
    canonical,
    languages: {
      fr: canonical,
      "x-default": canonical,
    },
  };
}
