import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICvCheckUsage extends Document {
  score: number;
  maxScore: number;
  pct: number;
  wordCount: number;
  locale: string;
  checkedAt: Date;
}

const CvCheckUsageSchema = new Schema<ICvCheckUsage>({
  score:      { type: Number, required: true },
  maxScore:   { type: Number, required: true },
  pct:        { type: Number, required: true },   // score/maxScore * 100
  wordCount:  { type: Number, default: 0 },
  locale:     { type: String, default: 'fr' },
  checkedAt:  { type: Date, default: Date.now },
});

export const CvCheckUsage: Model<ICvCheckUsage> =
  mongoose.models.CvCheckUsage ||
  mongoose.model<ICvCheckUsage>('CvCheckUsage', CvCheckUsageSchema);
