// Types officiels Europass selon les standards européens
// https://europass.cedefop.europa.eu/

export interface EuropassCV {
  version: string;
  locale: string;
  personalInfo: PersonalInfo;
  experience: WorkExperience[];
  education: Education[];
  languageSkills: LanguageSkill[];
  digitalSkills: DigitalSkill[];
  organizationalSkills: string[];
  interpersonalSkills: string[];
  otherSkills: string[];
  drivingLicense: string[];
  additionalInfo: string;
  attachments: Attachment[];
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  address: Address;
  dateOfBirth?: string;
  nationality?: string;
  photo?: string; // Base64 ou URL
  linkedin?: string;
  website?: string;
}

export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface WorkExperience {
  position: string;
  employer: string;
  startDate: string;
  endDate?: string; // null si poste actuel
  location: string;
  description: string;
  sector?: string;
  website?: string;
}

export interface Education {
  title: string;
  institution: string;
  startDate: string;
  endDate?: string;
  location: string;
  description?: string;
  level: EducationLevel;
  field?: string;
  grade?: string;
  website?: string;
}

export interface LanguageSkill {
  language: string;
  listening: CEFRLevel;
  reading: CEFRLevel;
  spokenInteraction: CEFRLevel;
  spokenProduction: CEFRLevel;
  writing: CEFRLevel;
  certificates?: Certificate[];
}

export interface DigitalSkill {
  category: DigitalSkillCategory;
  level: DigitalSkillLevel;
  description?: string;
}

export interface Certificate {
  title: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface Attachment {
  title: string;
  description?: string;
  url: string;
  type: AttachmentType;
}

// Énumérations standards Europass

export enum CEFRLevel {
  A1 = "A1",
  A2 = "A2",
  B1 = "B1",
  B2 = "B2",
  C1 = "C1",
  C2 = "C2"
}

export enum EducationLevel {
  PRIMARY = "ISCED-1",
  LOWER_SECONDARY = "ISCED-2",
  UPPER_SECONDARY = "ISCED-3",
  POST_SECONDARY = "ISCED-4",
  SHORT_CYCLE_TERTIARY = "ISCED-5",
  BACHELOR = "ISCED-6",
  MASTER = "ISCED-7",
  DOCTORAL = "ISCED-8"
}

export enum DigitalSkillCategory {
  INFORMATION_PROCESSING = "Information processing",
  COMMUNICATION = "Communication",
  CONTENT_CREATION = "Content creation",
  SAFETY = "Safety",
  PROBLEM_SOLVING = "Problem solving"
}

export enum DigitalSkillLevel {
  BASIC = "Basic",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
  HIGHLY_SPECIALISED = "Highly specialised"
}

export enum AttachmentType {
  CERTIFICATE = "certificate",
  DIPLOMA = "diploma",
  REFERENCE = "reference",
  PORTFOLIO = "portfolio",
  OTHER = "other"
}

// Types pour les sections Europass
export interface EuropassSection {
  id: string;
  title: string;
  required: boolean;
  order: number;
}

// Configuration des sections Europass
export const EUROPASS_SECTIONS: EuropassSection[] = [
  { id: 'personalInfo', title: 'Personal Information', required: true, order: 1 },
  { id: 'experience', title: 'Work Experience', required: false, order: 2 },
  { id: 'education', title: 'Education and Training', required: false, order: 3 },
  { id: 'languageSkills', title: 'Language Skills', required: false, order: 4 },
  { id: 'digitalSkills', title: 'Digital Skills', required: false, order: 5 },
  { id: 'organizationalSkills', title: 'Organisational Skills', required: false, order: 6 },
  { id: 'interpersonalSkills', title: 'Interpersonal Skills', required: false, order: 7 },
  { id: 'otherSkills', title: 'Other Skills', required: false, order: 8 },
  { id: 'drivingLicense', title: 'Driving License', required: false, order: 9 },
  { id: 'additionalInfo', title: 'Additional Information', required: false, order: 10 }
];

// Langues européennes communes
export const EUROPEAN_LANGUAGES = [
  'English', 'French', 'German', 'Spanish', 'Italian', 'Dutch', 'Portuguese',
  'Polish', 'Romanian', 'Czech', 'Hungarian', 'Swedish', 'Finnish', 'Danish',
  'Norwegian', 'Lithuanian', 'Latvian', 'Estonian', 'Slovak', 'Slovenian',
  'Croatian', 'Bulgarian', 'Greek', 'Maltese', 'Irish'
];

// Pays européens
export const EUROPEAN_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
  'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
  'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden'
];

// Types pour l'export
export interface EuropassExport {
  content: string;
  mimeType: string;
  filename: string;
  format: 'html' | 'json' | 'xml';
}
