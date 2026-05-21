import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { AssessmentAnswer, PersonalityResult, PremiumReport } from '@/types/personality';

export interface IPersonalityAssessment extends Document {
  userId?: mongoose.Types.ObjectId;
  sessionId: string;
  answers: AssessmentAnswer[];
  result: PersonalityResult;
  isPremium: boolean;
  premiumReport?: PremiumReport;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DimScores = new Schema({ L: Number, I: Number, S: Number, P: Number }, { _id: false });

const AnswerSchema = new Schema(
  { questionId: { type: Number, required: true }, selectedOption: { type: String, enum: ['A','B','C','D'], required: true } },
  { _id: false },
);

const ResultSchema = new Schema(
  { dominantType: String, secondaryType: String, scores: DimScores, percentages: DimScores, label: String, tagline: String, color: String, emoji: String },
  { _id: false },
);

const ReportSchema = new Schema(
  {
    overview: String, coreStrengths: String, potentialWeaknesses: String,
    leadershipStyle: String, communicationStyle: String, teamworkBehavior: String,
    stressResponse: String, workplaceCompatibility: String, productivityHabits: String,
    idealWorkEnvironment: String, careerRecommendations: String, interviewAdvice: String,
    bestManagementStyle: String, relationshipWithColleagues: String, decisionMakingStyle: String,
    careerGrowthAdvice: String, workplaceRisks: String, aiCareerCoaching: String, generatedAt: String,
  },
  { _id: false },
);

const AssessmentSchema = new Schema<IPersonalityAssessment>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'PersonalityUser' },
    sessionId:     { type: String, required: true, index: true },
    answers:       [AnswerSchema],
    result:        ResultSchema,
    isPremium:     { type: Boolean, default: false },
    premiumReport: ReportSchema,
    paymentId:     String,
  },
  { timestamps: true, collection: 'personality_assessments' },
);

const PersonalityAssessmentModel: Model<IPersonalityAssessment> =
  (mongoose.models.PersonalityAssessment as Model<IPersonalityAssessment>) ||
  mongoose.model<IPersonalityAssessment>('PersonalityAssessment', AssessmentSchema);

export default PersonalityAssessmentModel;
