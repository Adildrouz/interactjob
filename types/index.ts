export interface ConcoursFaqItem {
  q: string;
  a: string;
}

export interface Concours {
  id: string; // legacy uuidv4 (pre-Mongo entries only) — used for old-URL redirects
  sourceId: string;
  source: string;
  source_url: string;
  source_urls: string[];
  organisme_website: string | null;
  title_ar: string;
  title_fr: string;
  organization_ar: string;
  organization_fr: string;
  datePosted: string;
  deadline: string | null;
  date_concours: string | null;
  postes: number | null;
  niveau: string | null;
  specialites: string[];
  content_ar: string;
  summary_fr: string;
  analysis_fr: string;
  faq: ConcoursFaqItem[];
  meta_title: string;
  meta_description: string;
  status: "active" | "expired";
  slug: string;
}

export type JobLocalisation =
  | "presentiel"
  | "hybride"
  | "remote-maroc"
  | "remote-uk-eu"
  | "full-remote";

export type JobNiveau =
  | "stage"
  | "early-pro"
  | "junior"
  | "intermediaire"
  | "senior";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  companyColor: string;
  city: string;
  sector: string;
  contractType: "CDI" | "CDD" | "Stage";
  source: "Rekrute.com" | "Emploi.ma" | "Bayt.com" | "Direct";
  sourceUrl: string | null;
  salary?: string;
  experience?: string;
  description: string;
  requirements: string[];
  contactEmail: string;
  postedAt: string;
  featured: boolean;
  sponsored: boolean;
  expired?: boolean;
  localisation?: JobLocalisation;
  niveau?: JobNiveau;
}
