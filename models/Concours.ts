import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IConcoursFaqItem {
  q: string;
  a: string;
}

export interface IConcours extends Document {
  legacy_id?: string;
  sourceId: string;
  source: string;
  source_url: string;
  source_urls: string[];
  organisme_website?: string;
  organization_fr: string;
  organization_ar?: string;
  title_fr: string;
  title_ar?: string;
  slug: string;
  datePosted?: string | null;
  deadline?: string | null;
  date_concours?: string | null;
  postes?: number | null;
  niveau?: string | null;
  specialites: string[];
  content_ar?: string;
  summary_fr?: string;
  analysis_fr?: string;
  faq: IConcoursFaqItem[];
  meta_title?: string;
  meta_description?: string;
  status: 'active' | 'expired';
  scraped_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FaqItemSchema = new Schema<IConcoursFaqItem>(
  { q: { type: String, required: true }, a: { type: String, required: true } },
  { _id: false },
);

const ConcoursSchema = new Schema<IConcours>(
  {
    // Legacy uuidv4 assigned by the pre-Mongo scraper — only present on entries
    // migrated from data/concours.json, kept so old /concours/{uuid} URLs still
    // 301-redirect correctly instead of 404ing.
    legacy_id:        { type: String, index: true, sparse: true },
    sourceId:         { type: String, required: true },
    source:           { type: String, required: true, index: true },
    source_url:       { type: String, required: true },
    source_urls:      { type: [String], default: [] },
    organisme_website: String,
    organization_fr:  { type: String, required: true },
    organization_ar:  String,
    title_fr:         { type: String, required: true },
    title_ar:         String,
    slug:             { type: String, required: true, unique: true },
    datePosted:       String,
    deadline:         { type: String, default: null, index: true },
    date_concours:    String,
    postes:           Number,
    niveau:           String,
    specialites:      { type: [String], default: [] },
    content_ar:       String,
    summary_fr:       String,
    analysis_fr:      String,
    faq:              { type: [FaqItemSchema], default: [] },
    meta_title:       String,
    meta_description: String,
    status:           { type: String, enum: ['active', 'expired'], default: 'active', index: true },
    scraped_at:       { type: Date, default: Date.now },
  },
  { timestamps: true, collection: 'concours' },
);

const ConcoursModel: Model<IConcours> =
  (mongoose.models.Concours as Model<IConcours>) ||
  mongoose.model<IConcours>('Concours', ConcoursSchema);

export default ConcoursModel;
