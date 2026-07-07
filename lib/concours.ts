import { Concours } from "@/types";

/**
 * Converts a lean Mongo `concours` document (ObjectId _id, Date timestamps)
 * into the plain, serializable `Concours` shape the front-end components
 * expect — required because Server Components can't pass ObjectId/Date
 * instances as props to "use client" components.
 */
export function serializeConcours(doc: Record<string, any>): Concours {
  return {
    id: doc.legacy_id || String(doc._id),
    sourceId: String(doc.sourceId ?? ""),
    source: doc.source || "",
    source_url: doc.source_url || "",
    source_urls: doc.source_urls || [],
    organisme_website: doc.organisme_website || null,
    title_ar: doc.title_ar || "",
    title_fr: doc.title_fr || "",
    organization_ar: doc.organization_ar || "",
    organization_fr: doc.organization_fr || "",
    datePosted: doc.datePosted || "",
    deadline: doc.deadline || null,
    date_concours: doc.date_concours || null,
    postes: doc.postes ?? null,
    niveau: doc.niveau ?? null,
    specialites: doc.specialites || [],
    content_ar: doc.content_ar || "",
    summary_fr: doc.summary_fr || "",
    analysis_fr: doc.analysis_fr || "",
    faq: doc.faq || [],
    meta_title: doc.meta_title || "",
    meta_description: doc.meta_description || "",
    status: doc.status === "expired" ? "expired" : "active",
    slug: doc.slug,
  };
}

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

// --- Type d'annonce (emploi-public.ma style classification; keyword-inferred — no dedicated field in source data) ---

export const ANNONCE_TYPES = ["Concours de recrutement", "Emplois supérieurs", "Postes de responsabilité"] as const;
export type AnnonceType = (typeof ANNONCE_TYPES)[number];

export function inferAnnonceType(c: Concours): AnnonceType {
  const text = `${c.title_fr} ${c.summary_fr || ""}`.toLowerCase();
  if (/poste de responsabilité|postes de responsabilité|chef de division|directeur central/.test(text)) return "Postes de responsabilité";
  if (/emploi supérieur|emplois supérieurs|secrétaire général|directeur général/.test(text)) return "Emplois supérieurs";
  return "Concours de recrutement";
}

// --- Dépôt en ligne (best-effort: a listed organisme website or explicit "en ligne" mention) ---

export function inferOnlineSubmission(c: Concours): boolean {
  if (c.organisme_website) return true;
  const text = `${c.title_fr} ${c.summary_fr || ""}`.toLowerCase();
  return /dépôt en ligne|voie électronique|plateforme|candidature en ligne|inscription en ligne/.test(text);
}

// --- Organisme crest (initials-based placeholder, deterministic per name — no real logo assets available) ---

const CREST_STOPWORDS = new Set(["de", "des", "du", "la", "le", "les", "et", "à", "d'", "l'", "au", "aux", "en"]);
const CREST_COLORS = ["#00347A", "#00C2CB", "#2E7D52", "#6B4EA0", "#B5541F", "#1A6E8E"];

/** 2-3 letter initials from an organisme name, skipping French stopwords (e.g. "Ministère de la Santé" → "MS"). */
export function organismeInitials(name: string): string {
  const words = name
    .replace(/[()«»]/g, "")
    .split(/\s+/)
    .map((w) => w.replace(/^[ld]'/i, ""))
    .filter((w) => w && !CREST_STOPWORDS.has(w.toLowerCase()));
  const initials = words.slice(0, 3).map((w) => w[0]?.toUpperCase() || "").join("");
  return initials.slice(0, 3) || name.slice(0, 2).toUpperCase();
}

/** Deterministic color per organisme name so the same institution always renders the same crest color. */
export function organismeColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return CREST_COLORS[Math.abs(hash) % CREST_COLORS.length];
}

// --- Administrations qui recrutent (unique organismes among active concours) ---

export interface OrganismeSummary {
  name: string;
  count: number;
  postes: number;
  website: string | null;
}

export function aggregateOrganismes(list: Concours[]): OrganismeSummary[] {
  const map = new Map<string, OrganismeSummary>();
  for (const c of list) {
    const key = c.organization_fr;
    if (!key) continue;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.postes += c.postes || 0;
      existing.website = existing.website || c.organisme_website || null;
    } else {
      map.set(key, { name: key, count: 1, postes: c.postes || 0, website: c.organisme_website || null });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
