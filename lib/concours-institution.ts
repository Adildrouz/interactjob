// --- Institution visual identity ---------------------------------------------
// Classifies a public institution (by its French/Arabic name) into a type, and
// maps each type to a brand-consistent accent colour + label. The React emblem
// component (OrganismeCrest) pairs each type with a line icon and renders an
// original, uniform crest — no third-party logo assets, 100% coverage.
//
// A real logo can later be layered on top via `institutionLogo(name)` without
// touching any card code: populate INSTITUTION_LOGOS and the emblem swaps in.

export type InstitutionType =
  | "ministere"
  | "universite"
  | "sante"
  | "securite"
  | "justice"
  | "collectivite"
  | "etablissement"
  | "autre";

/** Accent palette — all derived from the concours brand (#00347A navy / #00C2CB teal),
 *  differentiated per institution type so the page reads visually, not just textually. */
export const INSTITUTION_STYLE: Record<
  InstitutionType,
  { accent: string; accentDark: string; soft: string; label: string }
> = {
  ministere:     { accent: "#00347A", accentDark: "#001F4D", soft: "#EAF0FA", label: "Ministère" },
  universite:    { accent: "#0E7C86", accentDark: "#075860", soft: "#E4F5F6", label: "Université / Enseignement" },
  sante:         { accent: "#0891B2", accentDark: "#075E74", soft: "#E2F4F9", label: "Santé" },
  securite:      { accent: "#1E3A5F", accentDark: "#0F2540", soft: "#E8EDF3", label: "Sécurité / Défense" },
  justice:       { accent: "#8B3A62", accentDark: "#5F2542", soft: "#F6E8EF", label: "Justice" },
  collectivite:  { accent: "#2E7D52", accentDark: "#1C5335", soft: "#E6F3EC", label: "Collectivité territoriale" },
  etablissement: { accent: "#5B4B9E", accentDark: "#3C316B", soft: "#EEEBF7", label: "Établissement public" },
  autre:         { accent: "#00347A", accentDark: "#001F4D", soft: "#EAF0FA", label: "Administration publique" },
};

// Keyword tables (French + Arabic — org names arrive in either script).
// Checked in priority order so e.g. "CHU" wins over "Ministère de la Santé".
const KEYWORDS: [InstitutionType, RegExp][] = [
  ["securite", /s[ûu]ret[ée]|gendarmerie|police|forces? arm[ée]es|protection civile|douane|militaire|s[ée]curit[ée] nationale|الأمن|الدرك|الوقاية المدنية|الجمارك|القوات المسلحة|الملكية/i],
  ["justice", /justice|tribunal|tribunaux|cour d.?appel|pouvoir judiciaire|magistrat|العدل|المحكمة|المجلس الأعلى للسلطة القضائية|القضاء/i],
  ["sante", /h[ôo]pital|hospitalier|\bchu\b|centre hospitalier|clinique|pharmacie|مستشفى|المركز الاستشفائي|الصحي/i],
  ["universite", /universit[ée]|facult[ée]|[ée]cole (nationale|sup[ée]rieure|normale)|\bensa\b|\bencg\b|\bensam\b|\best\b|institut|acad[ée]mie|جامعة|كلية|المدرسة|المعهد|الأكاديمية/i],
  ["ministere", /minist[èe]re|secr[ée]tariat d.?[ée]tat|haut[- ]commissariat|وزارة|كتابة الدولة|المندوبية السامية/i],
  ["collectivite", /commune|conseil (r[ée]gional|provincial|pr[ée]fectoral|communal)|r[ée]gion|province|pr[ée]fecture|collectivit[ée]|arrondissement|جماعة|عمالة|إقليم|جهة|مجلس|مقاطعة/i],
  ["etablissement", /office|agence|caisse|fonds|[ée]tablissement|\bocp\b|\boncf\b|\banapec\b|\bofppt\b|\bonee\b|\badm\b|\bcnss\b|\bcih\b|barid|autorit[ée]|r[ée]gie|soci[ée]t[ée]|الوكالة|المكتب|الصندوق|المؤسسة|الهيئة/i],
];

const _cache = new Map<string, InstitutionType>();

export function classifyInstitution(name: string | undefined | null): InstitutionType {
  if (!name) return "autre";
  const cached = _cache.get(name);
  if (cached) return cached;
  let result: InstitutionType = "autre";
  for (const [type, re] of KEYWORDS) {
    if (re.test(name)) { result = type; break; }
  }
  _cache.set(name, result);
  return result;
}

export function institutionStyle(name: string | undefined | null) {
  return INSTITUTION_STYLE[classifyInstitution(name)];
}

// --- Real-logo hook (future) -------------------------------------------------
// When official logo assets are added to /public/logos/institutions, map the
// normalised institution name here. Until then this returns null and the
// original type emblem is rendered — no broken images, ever.
export const INSTITUTION_LOGOS: Record<string, string> = {
  // "office cherifien des phosphates": "/logos/institutions/ocp.svg",
};

function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9؀-ۿ]+/g, " ")
    .trim();
}

export function institutionLogo(name: string | undefined | null): string | null {
  if (!name) return null;
  return INSTITUTION_LOGOS[normaliseName(name)] ?? null;
}
