// ── Dimension keys ────────────────────────────────────────────────────────────
export type DimensionKey = 'L' | 'I' | 'S' | 'P';

export interface DimensionScores {
  L: number;
  I: number;
  S: number;
  P: number;
}

// ── Question ──────────────────────────────────────────────────────────────────
export interface QuestionOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
  scores: Partial<DimensionScores>;
}

export interface Question {
  id: number;
  text: string;
  category: string;
  options: QuestionOption[];
}

// ── Result ────────────────────────────────────────────────────────────────────
export interface PersonalityResult {
  dominantType: PersonalityType;
  secondaryType?: PersonalityType;
  scores: DimensionScores;
  percentages: DimensionScores;
  label: string;
  tagline: string;
  color: string;
  emoji: string;
}

export type PersonalityType =
  | 'VISIONARY_LEADER'
  | 'DYNAMIC_INFLUENCER'
  | 'SUPPORTIVE_ANCHOR'
  | 'STRATEGIC_ANALYST'
  | 'INSPIRING_COMMANDER'
  | 'METHODICAL_LEADER'
  | 'EMPOWERED_BUILDER'
  | 'HARMONIOUS_ENERGIZER'
  | 'CREATIVE_STRATEGIST'
  | 'RELIABLE_ARCHITECT'
  | 'ADAPTIVE_PROFESSIONAL';

// ── Assessment ────────────────────────────────────────────────────────────────
export interface AssessmentAnswer {
  questionId: number;
  selectedOption: 'A' | 'B' | 'C' | 'D';
}

export interface Assessment {
  _id: string;
  userId?: string;
  sessionId: string;
  answers: AssessmentAnswer[];
  result: PersonalityResult;
  isPremium: boolean;
  premiumReport?: PremiumReport;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Premium Report ────────────────────────────────────────────────────────────
export interface PremiumReport {
  overview: string;
  coreStrengths: string;
  potentialWeaknesses: string;
  leadershipStyle: string;
  communicationStyle: string;
  teamworkBehavior: string;
  stressResponse: string;
  workplaceCompatibility: string;
  productivityHabits: string;
  idealWorkEnvironment: string;
  careerRecommendations: string;
  interviewAdvice: string;
  bestManagementStyle: string;
  relationshipWithColleagues: string;
  decisionMakingStyle: string;
  careerGrowthAdvice: string;
  workplaceRisks: string;
  aiCareerCoaching: string;
  generatedAt: string;
}

// ── Personality User ──────────────────────────────────────────────────────────
export interface PersonalityUser {
  _id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  assessments: string[];
}
