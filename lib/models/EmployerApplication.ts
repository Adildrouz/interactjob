import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ApplicationStatus = 'nouveau' | 'vu' | 'preselectionne' | 'refuse';

export interface IEmployerApplication extends Document {
  offer_id: Types.ObjectId;
  employer_id: Types.ObjectId;
  candidate_name: string;
  email: string;
  cv_url?: string;
  cover_letter?: string;
  personality_profile?: {
    mbti?: string;
    disc?: string;
    tested_at?: Date;
  };
  status: ApplicationStatus;
  is_seed?: boolean;
  created_at: Date;
}

const EmployerApplicationSchema = new Schema<IEmployerApplication>(
  {
    offer_id: { type: Schema.Types.ObjectId, ref: 'JobOffer', required: true },
    employer_id: { type: Schema.Types.ObjectId, ref: 'Employer', required: true },
    candidate_name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    cv_url: String,
    cover_letter: String,
    personality_profile: {
      mbti: String,
      disc: String,
      tested_at: Date,
    },
    status: {
      type: String,
      enum: ['nouveau', 'vu', 'preselectionne', 'refuse'],
      default: 'nouveau',
    },
    is_seed: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

EmployerApplicationSchema.index({ offer_id: 1, created_at: -1 });
EmployerApplicationSchema.index({ employer_id: 1, created_at: -1 });

export const EmployerApplication: Model<IEmployerApplication> =
  mongoose.models.EmployerApplication ??
  mongoose.model<IEmployerApplication>('EmployerApplication', EmployerApplicationSchema);
