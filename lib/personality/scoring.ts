import type { AssessmentAnswer, DimensionScores, PersonalityResult, PersonalityType } from '@/types/personality';
import { questions } from '@/data/personality/questions';

function calculateRawScores(answers: AssessmentAnswer[]): DimensionScores {
  const scores: DimensionScores = { L: 0, I: 0, S: 0, P: 0 };
  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (!question) continue;
    const option = question.options.find((o) => o.id === answer.selectedOption);
    if (!option) continue;
    for (const [dim, val] of Object.entries(option.scores) as [keyof DimensionScores, number][]) {
      scores[dim] = (scores[dim] ?? 0) + val;
    }
  }
  return scores;
}

function calculatePercentages(scores: DimensionScores): DimensionScores {
  const total = scores.L + scores.I + scores.S + scores.P;
  if (total === 0) return { L: 25, I: 25, S: 25, P: 25 };
  return {
    L: Math.round((scores.L / total) * 100),
    I: Math.round((scores.I / total) * 100),
    S: Math.round((scores.S / total) * 100),
    P: Math.round((scores.P / total) * 100),
  };
}

const COMBO_MAP: Record<string, PersonalityType> = {
  'L-I': 'INSPIRING_COMMANDER', 'L-S': 'EMPOWERED_BUILDER', 'L-P': 'METHODICAL_LEADER',
  'I-L': 'INSPIRING_COMMANDER', 'I-S': 'HARMONIOUS_ENERGIZER', 'I-P': 'CREATIVE_STRATEGIST',
  'S-L': 'EMPOWERED_BUILDER', 'S-I': 'HARMONIOUS_ENERGIZER', 'S-P': 'RELIABLE_ARCHITECT',
  'P-L': 'METHODICAL_LEADER', 'P-I': 'CREATIVE_STRATEGIST', 'P-S': 'RELIABLE_ARCHITECT',
};

const SINGLE_MAP: Record<string, PersonalityType> = {
  L: 'VISIONARY_LEADER', I: 'DYNAMIC_INFLUENCER', S: 'SUPPORTIVE_ANCHOR', P: 'STRATEGIC_ANALYST',
};

const PROFILE_DATA: Record<PersonalityType, { label: string; tagline: string; color: string; emoji: string }> = {
  VISIONARY_LEADER:      { label: 'Visionary Leader',      tagline: 'You set the direction and inspire others to follow',              color: '#6366f1', emoji: '🦁' },
  DYNAMIC_INFLUENCER:    { label: 'Dynamic Influencer',    tagline: 'You energize rooms and move people through charisma',             color: '#ec4899', emoji: '🌟' },
  SUPPORTIVE_ANCHOR:     { label: 'Supportive Anchor',     tagline: 'You are the steady force that keeps teams grounded',              color: '#10b981', emoji: '⚓' },
  STRATEGIC_ANALYST:     { label: 'Strategic Analyst',     tagline: 'You turn complex data into clear, confident decisions',           color: '#3b82f6', emoji: '🔬' },
  INSPIRING_COMMANDER:   { label: 'Inspiring Commander',   tagline: 'You lead boldly while rallying hearts and minds',                 color: '#8b5cf6', emoji: '⚡' },
  METHODICAL_LEADER:     { label: 'Methodical Leader',     tagline: 'You build lasting results through disciplined execution',         color: '#0ea5e9', emoji: '🏗️' },
  EMPOWERED_BUILDER:     { label: 'Empowered Builder',     tagline: 'You create stable progress through team-first leadership',        color: '#14b8a6', emoji: '🌱' },
  HARMONIOUS_ENERGIZER:  { label: 'Harmonious Energizer',  tagline: 'You bring warmth, energy, and unity to every group',             color: '#f59e0b', emoji: '🎯' },
  CREATIVE_STRATEGIST:   { label: 'Creative Strategist',   tagline: 'You craft innovative solutions with analytical precision',        color: '#a855f7', emoji: '🎨' },
  RELIABLE_ARCHITECT:    { label: 'Reliable Architect',    tagline: 'You design systems people trust and processes that last',         color: '#64748b', emoji: '📐' },
  ADAPTIVE_PROFESSIONAL: { label: 'Adaptive Professional', tagline: 'You thrive by reading situations and adjusting your style',       color: '#f97316', emoji: '🔄' },
};

function determineTypes(percentages: DimensionScores) {
  const sorted = (Object.entries(percentages) as [keyof DimensionScores, number][]).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const secondary = sorted[1][1] >= 20 && sorted[0][1] - sorted[1][1] < 30 ? sorted[1][0] : undefined;
  return { dominant, secondary };
}

function resolvePersonalityType(dominant: keyof DimensionScores, secondary?: keyof DimensionScores): PersonalityType {
  if (!secondary) return SINGLE_MAP[dominant];
  return COMBO_MAP[`${dominant}-${secondary}`] ?? SINGLE_MAP[dominant];
}

export function scoreAssessment(answers: AssessmentAnswer[]): PersonalityResult {
  const scores = calculateRawScores(answers);
  const percentages = calculatePercentages(scores);
  const { dominant, secondary } = determineTypes(percentages);
  const dominantType = resolvePersonalityType(dominant, secondary);
  let secondaryType: PersonalityType | undefined;
  if (secondary) {
    secondaryType = resolvePersonalityType(secondary, dominant);
    if (secondaryType === dominantType) secondaryType = undefined;
  }
  const profile = PROFILE_DATA[dominantType];
  return { dominantType, secondaryType, scores, percentages, label: profile.label, tagline: profile.tagline, color: profile.color, emoji: profile.emoji };
}

export { PROFILE_DATA };
