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
}
