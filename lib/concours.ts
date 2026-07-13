import { Concours } from "@/types";

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-MA", { day: "numeric", month: "long", year: "numeric" });
}

export function isExpired(deadline: string | null) {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

/** Closing within the next N days (default 7 — matches the "ferment bientôt" urgency window). */
export function isExpiringSoon(deadline: string | null, days = 7) {
  if (!deadline) return false;
  const diff = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

// Best-effort signal only — the data model has no structured "results published"
// field yet (that's the separate convocation-lists/results scraping feature).
// Until that exists, detect result-bearing content by keyword so a closed
// concours whose page has been updated with lists/results stays indexed
// (those pages drive real search traffic), while ones with nothing new stay
// noindexed once expired.
const RESULTS_KEYWORDS = [
  "نتائج", "النتائج النهائية", "لوائح المدعوين", "لائحة المقبولين", "لائحة",
  "résultats", "résultat définitif", "liste des candidats convoqués", "convoqués", "admis",
];

export function hasResults(c: Concours): boolean {
  const text = `${c.title_fr} ${c.title_ar} ${c.summary_fr || ""} ${c.content_ar || ""}`.toLowerCase();
  return RESULTS_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

// --- Secteur (for the concours filter bar) ---

export const CONCOURS_SECTORS = ["Santé", "Éducation", "Sécurité", "Finance", "Ingénierie"] as const;
export type ConcoursSector = (typeof CONCOURS_SECTORS)[number] | "Administratif";

const CONCOURS_SECTOR_KEYWORDS: Record<(typeof CONCOURS_SECTORS)[number], string[]> = {
  "Santé": ["santé", "hôpital", "médecin", "infirmier", "pharmacie", "soins", "chis", "chu"],
  "Éducation": ["enseignement", "éducation", "école", "université", "formation", "académie", "lycée", "ofppt"],
  "Sécurité": ["police", "gendarmerie", "armée", "défense", "sûreté", "dgsn", "far", "sécurité", "forces armées", "protection civile"],
  "Finance": ["banque", "finance", "fiscal", "douane", "trésorerie", "budget", "comptable", "audit", "impôts"],
  "Ingénierie": ["ingénieur", "technique", "génie", "industrie", "maintenance", "électro", "mécanique"],
};

/** Best-effort sector classification for filtering the concours listing itself. */
export function inferConcoursSector(c: Concours): ConcoursSector {
  const text = `${c.title_fr} ${c.organization_fr} ${c.summary_fr || ""}`.toLowerCase();
  for (const sector of CONCOURS_SECTORS) {
    if (CONCOURS_SECTOR_KEYWORDS[sector].some((kw) => text.includes(kw))) return sector;
  }
  return "Administratif";
}

// --- Secteur (for matching against private-sector job listings, separate taxonomy) ---

const JOB_SECTOR_KEYWORDS: Record<string, string[]> = {
  Administratif: ["administration", "administratif", "ministère", "collectivité", "commune", "préfecture", "province", "wilaya", "fonction publique"],
  Finance: ["banque", "finance", "fiscal", "douane", "trésorerie", "budget", "comptable", "audit", "cih", "attijariwafa"],
  IT: ["informatique", "numérique", "digital", "télécommunication", "réseau", "système", "technologie"],
  Santé: ["santé", "hôpital", "médecin", "infirmier", "pharmacie", "soins", "chis", "chu"],
  Éducation: ["enseignement", "éducation", "école", "université", "formation", "académie", "lycée", "ofppt"],
  Industrie: ["industrie", "usine", "production", "ingénieur", "technique", "maintenance", "onda", "oncf"],
  BTP: ["btp", "construction", "travaux", "architecture", "urbanisme", "équipement"],
  Logistique: ["logistique", "transport", "douane", "import", "export", "port", "onca"],
};

/** Best-effort sector classification for matching a concours to relevant private-sector jobs. */
export function inferJobSector(c: Concours): string | null {
  const text = `${c.title_fr} ${c.organization_fr}`.toLowerCase();
  for (const [sector, keywords] of Object.entries(JOB_SECTOR_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) return sector;
  }
  return null;
}

// --- Région (best-effort, inferred from city/place mentions) ---

export const MOROCCO_REGIONS = [
  "Tanger-Tétouan-Al Hoceïma",
  "Oriental",
  "Fès-Meknès",
  "Rabat-Salé-Kénitra",
  "Béni Mellal-Khénifra",
  "Casablanca-Settat",
  "Marrakech-Safi",
  "Drâa-Tafilalet",
  "Souss-Massa",
  "Guelmim-Oued Noun",
  "Laâyoune-Sakia El Hamra",
  "Dakhla-Oued Ed-Dahab",
] as const;
export type MoroccoRegion = (typeof MOROCCO_REGIONS)[number] | "National";

const REGION_CITY_KEYWORDS: Record<(typeof MOROCCO_REGIONS)[number], string[]> = {
  "Tanger-Tétouan-Al Hoceïma": ["tanger", "tétouan", "tetouan", "al hoceïma", "al hoceima", "chefchaouen", "larache"],
  "Oriental": ["oujda", "nador", "berkane", "taourirt"],
  "Fès-Meknès": ["fès", "fes ", " fes", "meknès", "meknes", "taza", "ifrane"],
  "Rabat-Salé-Kénitra": ["rabat", "salé", "sale", "kénitra", "kenitra", "khémisset", "khemisset"],
  "Béni Mellal-Khénifra": ["béni mellal", "beni mellal", "khénifra", "khenifra", "azilal"],
  "Casablanca-Settat": ["casablanca", "settat", "mohammedia", "el jadida", "berrechid"],
  "Marrakech-Safi": ["marrakech", "safi", "essaouira", "kelaa", "kalaa"],
  "Drâa-Tafilalet": ["ouarzazate", "errachidia", "zagora", "midelt"],
  "Souss-Massa": ["agadir", "taroudant", "tiznit"],
  "Guelmim-Oued Noun": ["guelmim", "tan-tan", "tan tan", "sidi ifni"],
  "Laâyoune-Sakia El Hamra": ["laâyoune", "laayoune", "boujdour", "smara"],
  "Dakhla-Oued Ed-Dahab": ["dakhla"],
};

/** Best-effort region classification from city mentions in title/summary. Falls back to "National" (multi-region or unspecified). */
export function inferRegion(c: Concours): MoroccoRegion {
  const text = `${c.title_fr} ${c.summary_fr || ""}`.toLowerCase();
  for (const region of MOROCCO_REGIONS) {
    if (REGION_CITY_KEYWORDS[region].some((kw) => text.includes(kw))) return region;
  }
  return "National";
}

// --- Niveau (filter options; raw field values are compound strings like "Master / Ingénieur / Bac+2") ---

export const CONCOURS_NIVEAUX = ["Bac", "Bac+2", "Bac+3", "Licence", "Master", "Ingénieur", "Bac+5", "Doctorat"] as const;

export function matchesNiveau(c: Concours, niveau: string) {
  return !!c.niveau && c.niveau.includes(niveau);
}
