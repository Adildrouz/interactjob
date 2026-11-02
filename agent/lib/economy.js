// Budget policy: paid AI is opt-in; existing factual templates remain available.
export function aiGenerationEnabled() {
  return process.env.AGENT_AI_ENABLED === 'true';
}

export const DAILY_LINKEDIN_LABEL = '12:00 OFFRES MIDI';

export function linkedinSlotEnabled(label) {
  return label === DAILY_LINKEDIN_LABEL;
}
