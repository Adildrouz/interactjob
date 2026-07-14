import mongoose from "mongoose";

export interface IEmployerHubFaqItem {
  question: string;
  answer: string;
}

export interface IEmployerHubStep {
  title: string;
  body: string;
}

export interface IEmployerHub {
  _id?: string;
  slug: string;
  name: string;
  name_ar: string;
  logo?: string;
  sector: string;
  description: string;
  description_ar: string;
  official_website: string;
  how_to_apply: IEmployerHubStep[];
  how_to_apply_ar: IEmployerHubStep[];
  how_to_register: IEmployerHubStep[];
  how_to_register_ar: IEmployerHubStep[];
  faq: IEmployerHubFaqItem[];
  faq_ar: IEmployerHubFaqItem[];
  // Case-insensitive substring terms matched against a job's title+company+
  // description to surface genuinely related postings — deliberately NOT a
  // literal "employer" field, since jobs.json/concours.json have no reliable
  // structured tagging identifying an employer as ANAPEC (or any other hub
  // employer) itself; every current match is free-text mentioning the
  // ANAPEC/IDMAJ contract mechanism on a DIFFERENT employer's posting. The
  // page must label that section honestly rather than imply direct hiring.
  job_match_keywords: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const faqItemSchema = new mongoose.Schema<IEmployerHubFaqItem>(
  { question: { type: String, required: true }, answer: { type: String, required: true } },
  { _id: false }
);

const stepSchema = new mongoose.Schema<IEmployerHubStep>(
  { title: { type: String, required: true }, body: { type: String, required: true } },
  { _id: false }
);

const employerHubSchema = new mongoose.Schema<IEmployerHub>({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  name_ar: { type: String, required: true },
  logo: String,
  sector: { type: String, required: true },
  description: { type: String, required: true },
  description_ar: { type: String, required: true },
  official_website: { type: String, required: true },
  how_to_apply: [stepSchema],
  how_to_apply_ar: [stepSchema],
  how_to_register: [stepSchema],
  how_to_register_ar: [stepSchema],
  faq: [faqItemSchema],
  faq_ar: [faqItemSchema],
  job_match_keywords: [String],
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

employerHubSchema.index({ is_active: 1 });

export const EmployerHub = mongoose.models.EmployerHub || mongoose.model<IEmployerHub>("EmployerHub", employerHubSchema, "employers_hub");
