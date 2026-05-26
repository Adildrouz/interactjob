export interface Concours {
  id: string;
  sourceId: number;
  sourceUrl: string;
  title_ar: string;
  title_fr: string;
  organization_ar: string;
  organization_fr: string;
  datePosted: string;
  deadline: string | null;
  postes: number | null;
  niveau: string | null;
  content_ar: string;
  summary_fr: string;
  meta_title: string;
  meta_description: string;
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
