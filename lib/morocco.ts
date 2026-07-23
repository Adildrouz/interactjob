/**
 * Canonical Moroccan geography + job sectors — single source of truth for
 * every city/sector select across the site (search filters, job posting,
 * alerts, profiles, talent pool).
 *
 * Cities cover all 12 regions: every prefecture/province capital plus
 * well-known secondary cities. Grouped by region for usable dropdowns.
 *
 * Sector values keep the short canonical keys already stored in
 * data/jobs.json ("IT", "Finance", …) so existing data keeps matching;
 * new sectors extend the same convention. Legacy long labels written by
 * older admin/employer forms are normalized via normalizeSector().
 */

export interface RegionCities {
  region: string;
  cities: string[];
}

export const MOROCCO_REGIONS: RegionCities[] = [
  {
    region: "Casablanca-Settat",
    cities: [
      "Casablanca", "Mohammedia", "El Jadida", "Settat", "Berrechid",
      "Benslimane", "Bouskoura", "Dar Bouazza", "Médiouna", "Nouaceur",
      "Sidi Bennour", "Azemmour",
    ],
  },
  {
    region: "Rabat-Salé-Kénitra",
    cities: [
      "Rabat", "Salé", "Kénitra", "Témara", "Skhirat", "Khémisset",
      "Sidi Kacem", "Sidi Slimane", "Tiflet",
    ],
  },
  {
    region: "Marrakech-Safi",
    cities: [
      "Marrakech", "Safi", "Essaouira", "El Kelâa des Sraghna",
      "Ben Guerir", "Youssoufia", "Chichaoua", "Imintanoute",
    ],
  },
  {
    region: "Fès-Meknès",
    cities: [
      "Fès", "Meknès", "Taza", "Sefrou", "Ifrane", "Azrou", "El Hajeb",
      "Taounate", "Missour", "Moulay Yacoub", "Imouzzer Kandar",
    ],
  },
  {
    region: "Tanger-Tétouan-Al Hoceïma",
    cities: [
      "Tanger", "Tétouan", "Al Hoceïma", "Larache", "Ksar El Kébir",
      "Chefchaouen", "Ouezzane", "Fnideq", "M'diq", "Martil", "Assilah",
    ],
  },
  {
    region: "Souss-Massa",
    cities: [
      "Agadir", "Inezgane", "Aït Melloul", "Taroudant", "Tiznit",
      "Oulad Teïma", "Biougra", "Tata",
    ],
  },
  {
    region: "Oriental",
    cities: [
      "Oujda", "Nador", "Berkane", "Taourirt", "Guercif", "Jerada",
      "Driouch", "Figuig", "Bouarfa", "Saïdia",
    ],
  },
  {
    region: "Béni Mellal-Khénifra",
    cities: [
      "Béni Mellal", "Khouribga", "Khénifra", "Fquih Ben Salah",
      "Azilal", "Kasba Tadla", "Oued Zem", "Demnate",
    ],
  },
  {
    region: "Drâa-Tafilalet",
    cities: [
      "Errachidia", "Ouarzazate", "Midelt", "Tinghir", "Zagora",
      "Erfoud", "Rissani",
    ],
  },
  {
    region: "Guelmim-Oued Noun",
    cities: ["Guelmim", "Tan-Tan", "Sidi Ifni", "Assa"],
  },
  {
    region: "Laâyoune-Sakia El Hamra",
    cities: ["Laâyoune", "Boujdour", "Es-Semara", "Tarfaya"],
  },
  {
    region: "Dakhla-Oued Ed-Dahab",
    cities: ["Dakhla", "Aousserd"],
  },
];

/** Flat list of every city (region order preserved). */
export const ALL_CITIES: string[] = MOROCCO_REGIONS.flatMap((r) => r.cities);

/* ------------------------------------------------------------------ */
/* Sectors                                                             */
/* ------------------------------------------------------------------ */

export interface Sector {
  /** Canonical stored value (matches historical data where it existed). */
  value: string;
  label: string;
  labelAr: string;
}

export const SECTORS: Sector[] = [
  { value: "IT", label: "Informatique & Digital", labelAr: "تقنية المعلومات والرقمنة" },
  { value: "BPO", label: "BPO & Centres d'appel", labelAr: "مراكز النداء والترحيل الخدمي" },
  { value: "Automobile", label: "Industrie automobile & aéronautique", labelAr: "صناعة السيارات والطيران" },
  { value: "Industrie", label: "Industrie & Production", labelAr: "الصناعة والإنتاج" },
  { value: "Textile", label: "Textile & Cuir", labelAr: "النسيج والجلد" },
  { value: "BTP", label: "BTP & Construction", labelAr: "البناء والأشغال العمومية" },
  { value: "Ingénierie", label: "Ingénierie & Bureaux d'études", labelAr: "الهندسة ومكاتب الدراسات" },
  { value: "Santé", label: "Santé & Médical", labelAr: "الصحة والطب" },
  { value: "Commerce", label: "Commerce & Vente", labelAr: "التجارة والبيع" },
  { value: "Marketing", label: "Marketing & Communication", labelAr: "التسويق والتواصل" },
  { value: "Hôtellerie", label: "Hôtellerie, Restauration & Tourisme", labelAr: "الفندقة والمطاعم والسياحة" },
  { value: "Finance", label: "Finance, Comptabilité & Audit", labelAr: "المالية والمحاسبة والتدقيق" },
  { value: "Banque", label: "Banque & Assurance", labelAr: "البنوك والتأمين" },
  { value: "RH", label: "RH & Recrutement", labelAr: "الموارد البشرية والتوظيف" },
  { value: "Juridique", label: "Juridique", labelAr: "القانون" },
  { value: "Éducation", label: "Éducation & Formation", labelAr: "التعليم والتكوين" },
  { value: "Agriculture", label: "Agriculture & Agroalimentaire", labelAr: "الفلاحة والصناعات الغذائية" },
  { value: "Logistique", label: "Logistique & Transport", labelAr: "اللوجستيك والنقل" },
  { value: "Énergie", label: "Énergie & Environnement", labelAr: "الطاقة والبيئة" },
  { value: "Télécoms", label: "Télécommunications", labelAr: "الاتصالات" },
  { value: "Immobilier", label: "Immobilier", labelAr: "العقار" },
  { value: "Artisanat", label: "Artisanat & Métiers manuels", labelAr: "الصناعة التقليدية والحرف" },
  { value: "Administratif", label: "Administratif & Secrétariat", labelAr: "الإداري والسكرتارية" },
  { value: "Administration publique", label: "Administration publique", labelAr: "الإدارة العمومية" },
  { value: "Autre", label: "Autre (préciser)", labelAr: "أخرى (حدّد)" },
];

/** Legacy sector strings written by older forms → canonical value. */
const LEGACY_SECTOR_MAP: Record<string, string> = {
  "Informatique & Tech": "IT",
  "Finance & Comptabilité": "Finance",
  "Marketing & Communication": "Marketing",
  "RH & Recrutement": "RH",
  "Commercial & Vente": "Commerce",
  "Logistique & Supply Chain": "Logistique",
  "Ingénierie & Production": "Ingénierie",
  "Éducation & Formation": "Éducation",
  "Hôtellerie & Tourisme": "Hôtellerie",
  "BTP & Architecture": "BTP",
};

/** Normalize any stored sector string to its canonical value. */
export function normalizeSector(raw: string | undefined | null): string {
  if (!raw) return "";
  return LEGACY_SECTOR_MAP[raw] ?? raw;
}

export function sectorLabel(value: string, locale: string = "fr"): string {
  const canonical = normalizeSector(value);
  const s = SECTORS.find((x) => x.value === canonical);
  if (!s) return value;
  return locale === "ar" ? s.labelAr : s.label;
}
