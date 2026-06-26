import mongoose, { Schema, Document, Model } from 'mongoose';

export type EmployerPlan = 'standard' | 'pack_sponsoring' | 'pro' | 'business';

export interface IEmployer extends Document {
  email: string;
  password_hash: string;
  company_name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  sector?: string;
  website?: string;
  location?: string;
  size?: string;
  verified: boolean;
  email_verified: boolean;
  email_verify_token?: string;
  plan: EmployerPlan;
  plan_expires_at?: Date;
  sponsoring_credits: number;
  credits_expire_at?: Date;
  phone?: string;
  trusted: boolean; // auto-approve after 3 approved offers
  approved_offers_count: number;
  role: 'employer';
  is_seed?: boolean;
  created_at: Date;
}

const EmployerSchema = new Schema<IEmployer>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    company_name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo_url: String,
    description: String,
    sector: String,
    website: String,
    location: String,
    size: String,
    verified: { type: Boolean, default: false },
    email_verified: { type: Boolean, default: false },
    email_verify_token: String,
    plan: { type: String, enum: ['standard', 'pack_sponsoring', 'pro', 'business'], default: 'standard' },
    plan_expires_at: Date,
    sponsoring_credits: { type: Number, default: 0 },
    credits_expire_at: Date,
    phone: { type: String, trim: true },
    trusted: { type: Boolean, default: false },
    approved_offers_count: { type: Number, default: 0 },
    role: { type: String, default: 'employer' },
    is_seed: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

EmployerSchema.index({ slug: 1 });
EmployerSchema.index({ email: 1 });
EmployerSchema.index({ plan: 1 });

export const Employer: Model<IEmployer> =
  mongoose.models.Employer ?? mongoose.model<IEmployer>('Employer', EmployerSchema);
