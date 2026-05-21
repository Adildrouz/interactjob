import Anthropic from '@anthropic-ai/sdk';
import type { PersonalityResult, PremiumReport } from '@/types/personality';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPrompt(result: PersonalityResult): string {
  const dimLabels = { L: 'Leader Energy', I: 'Social Influence', S: 'Stability & Support', P: 'Precision & Analysis' };
  const dimBreakdown = Object.entries(result.percentages)
    .map(([k, v]) => `${dimLabels[k as keyof typeof dimLabels]}: ${v}%`)
    .join(', ');

  return `You are an expert industrial-organizational psychologist and executive career coach. Generate a comprehensive, actionable workplace personality report for:

Personality Type: ${result.label} (${result.dominantType})
${result.secondaryType ? `Secondary Profile: ${result.secondaryType}` : ''}
Behavioral Dimensions: ${dimBreakdown}
Summary: ${result.tagline}

Write 18 sections (150-250 words each), highly specific to this profile, immediately actionable, second person ("You..."). No generic advice.

Respond ONLY with a valid JSON object with these exact keys:
{"overview":"...","coreStrengths":"...","potentialWeaknesses":"...","leadershipStyle":"...","communicationStyle":"...","teamworkBehavior":"...","stressResponse":"...","workplaceCompatibility":"...","productivityHabits":"...","idealWorkEnvironment":"...","careerRecommendations":"...","interviewAdvice":"...","bestManagementStyle":"...","relationshipWithColleagues":"...","decisionMakingStyle":"...","careerGrowthAdvice":"...","workplaceRisks":"...","aiCareerCoaching":"..."}`;
}

export async function generatePremiumReport(result: PersonalityResult): Promise<PremiumReport> {
  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    messages: [{ role: 'user', content: buildPrompt(result) }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude returned invalid JSON');

  const parsed = JSON.parse(jsonMatch[0]) as Omit<PremiumReport, 'generatedAt'>;
  return { ...parsed, generatedAt: new Date().toISOString() };
}
