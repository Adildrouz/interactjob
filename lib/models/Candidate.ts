import mongoose from 'mongoose';

export interface ICandidate {
  _id?: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  sectors: string[];
  position: string;
  experienceLevel: string;
  availability: string;
  languages: string[];
  linkedin: string;
  about: string;
  cvFilename: string;
  cvPath: string;
  submittedAt: string;
  status: string;
  notes: string;
  starred: boolean;
  viewed: boolean;
  tags: string[];
  source: string;
}

const candidateSchema = new mongoose.Schema<ICandidate>({
  id: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  city: { type: String, required: true },
  sectors: [String],
  position: { type: String, required: true },
  experienceLevel: { type: String, required: true },
  availability: { type: String, required: true },
  languages: [String],
  linkedin: String,
  about: { type: String, required: true },
  cvFilename: String,
  cvPath: String,
  submittedAt: { type: String, required: true },
  status: { type: String, default: 'Nouveau' },
  notes: { type: String, default: '' },
  starred: { type: Boolean, default: false },
  viewed: { type: Boolean, default: false },
  tags: [String],
  source: { type: String, default: 'website-form' },
});

// Create indexes for better query performance
candidateSchema.index({ email: 1 });
candidateSchema.index({ submittedAt: -1 });
candidateSchema.index({ status: 1 });
candidateSchema.index({ city: 1 });
candidateSchema.index({ sectors: 1 });

export const Candidate = mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', candidateSchema);
