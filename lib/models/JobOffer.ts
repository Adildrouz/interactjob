import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type JobOfferStatus = 'draft' | 'pending' | 'active' | 'expired' | 'suspended' | 'rejected';
export type ApplicationMethod = 'email' | 'url';

export interface IJobOffer extends Document {
  employer_id: Types.ObjectId;
  title: string;
  description: string;
  location: string;
  contract_type: string;
  salary?: string;
  level?: string;
  sector?: string;
  status: JobOfferStatus;
  is_sponsored: boolean;
  sponsored_until?: Date;
  views: number;
  ai_enriched: boolean;
  application_method: ApplicationMethod;
  application_email?: string;
  application_url?: string;
  rejection_reason?: string;
  is_seed?: boolean;
  created_at: Date;
  expires_at?: Date;
}

const JobOfferSchema = new Schema<IJobOffer>(
  {
    employer_id: { type: Schema.Types.ObjectId, ref: 'Employer', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    contract_type: { type: String, required: true },
    salary: String,
    level: String,
    sector: String,
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'expired', 'suspended', 'rejected'],
      default: 'pending',
    },
    is_sponsored: { type: Boolean, default: false },
    sponsored_until: Date,
    views: { type: Number, default: 0 },
    ai_enriched: { type: Boolean, default: false },
    application_method: { type: String, enum: ['email', 'url'], default: 'email' },
    application_email: String,
    application_url: String,
    rejection_reason: String,
    is_seed: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    expires_at: Date,
  },
  { timestamps: false }
);

JobOfferSchema.index({ employer_id: 1, status: 1 });
JobOfferSchema.index({ status: 1, created_at: -1 });
JobOfferSchema.index({ is_sponsored: 1, sponsored_until: 1 });

export const JobOffer: Model<IJobOffer> =
  mongoose.models.JobOffer ?? mongoose.model<IJobOffer>('JobOffer', JobOfferSchema);
