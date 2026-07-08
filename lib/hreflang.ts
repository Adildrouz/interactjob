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
 * For sections with real FR + AR content but no English translation (e.g.
 * /concours — the underlying data has title_fr/title_ar but no title_en).
 * The /en/... URL still renders (translated chrome around the French data,
 * useful for an English-speaking user), but only fr/ar are declared as real
 * alternates — declaring a fake `en` alternate is exactly the class of bug
 * this codebase already hit once with the blog and code-travail sections
 * (see Phase 0 i18n foundation history).
 */
export function buildFrArAlternates(frPath: string) {
  const canonical = `${BASE_URL}${frPath}`;
  const arPath = frPath === "/" ? "/ar" : `/ar${frPath}`;
  return {
    canonical,
    languages: {
      fr: canonical,
      ar: `${BASE_URL}${arPath}`,
      "x-default": canonical,
    },
  };
}

/**
 * For sections whose content is entirely FR-only with no real AR or EN
 * translation yet. The /en/... and /ar/... URLs still render (same French
 * content, useful for users who land there), but canonical always points at
 * the FR master and no fake per-language alternate is declared.
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
