import mongoose from 'mongoose';

/**
 * Stores the uploaded CV (PDF) binary in MongoDB, separate from the Candidate
 * document so candidate-list queries stay lightweight and never pull megabytes.
 * Keyed by the candidate's `id` (the same UUID stored on the Candidate).
 */
export interface ICandidateCV {
  candidateId: string;
  filename: string;
  contentType: string;
  data: Buffer;
  size: number;
  createdAt: string;
}

const candidateCVSchema = new mongoose.Schema<ICandidateCV>({
  candidateId: { type: String, required: true, unique: true, index: true },
  filename: { type: String, required: true },
  contentType: { type: String, default: 'application/pdf' },
  data: { type: Buffer, required: true },
  size: { type: Number, default: 0 },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const CandidateCV =
  mongoose.models.CandidateCV ||
  mongoose.model<ICandidateCV>('CandidateCV', candidateCVSchema);
