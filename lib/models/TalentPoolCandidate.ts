import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITalentPoolCandidate extends Document {
  name: string;
  email: string;
  sector?: string;
  location?: string;
  experience_level?: string;
  skills: string[];
  cv_url?: string;
  cover_letter?: string;
  personality_profile?: {
    mbti?: string;
    disc?: string;
  };
  favorited_by: string[]; // employer_id list
  is_seed?: boolean;
  created_at: Date;
}

const TalentPoolCandidateSchema = new Schema<ITalentPoolCandidate>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    sector: String,
    location: String,
    experience_level: String,
    skills: [String],
    cv_url: String,
    cover_letter: String,
    personality_profile: {
      mbti: String,
      disc: String,
    },
    favorited_by: [String],
    is_seed: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

TalentPoolCandidateSchema.index({ sector: 1, location: 1 });
TalentPoolCandidateSchema.index({ experience_level: 1 });

export const TalentPoolCandidate: Model<ITalentPoolCandidate> =
  mongoose.models.TalentPoolCandidate ??
  mongoose.model<ITalentPoolCandidate>('TalentPoolCandidate', TalentPoolCandidateSchema);
