/**
 * Claude Haiku enrichment for the concours pipeline — shared by every adapter.
 *
 * Two modes, chosen by whether the record already has native French fields:
 *  - alwadifa-style (Arabic source): translate title/organisme, extract
 *    deadline/postes/niveau from Arabic content, AND generate the unique
 *    analysis/FAQ/meta fields — same shape as the original
 *    concours-parser.js enrichWithClaude(), extended with analysis_fr + faq.
 *  - emploi-public.ma-style (French source): title/organisme/deadline/postes
 *    are already reliably scraped — only ask Claude to normalize `niveau`
 *    (when missing) and generate summary_fr/meta_title/meta_description/
 *    analysis_fr/faq. Never re-translate content that's already French.
 *
 * analysis_fr/faq are always freshly generated from the scraped facts, never
 * copied from the source — this is what makes each InteractJob concours page
 * genuinely original rather than a re-hosted aggregator listing.
 */

import Anthropic from '@anthropic-ai/sdk';

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

function parseJsonResponse(text) {
  const cleaned = text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(cleaned);
}

function buildPrompt(rec) {
  const needsTranslation = !rec.title_fr && !!rec.title_ar;

  if (needsTranslation) {
    return `Tu es un assistant spécialisé dans les concours de la fonction publique marocaine.

Voici un concours en arabe :
Titre (AR) : ${rec.title_ar}
Organisation (AR) : ${rec.organization_ar}
Date de publication : ${rec.datePosted}
Contenu (AR) : ${rec.content_ar}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown) avec ces champs :
{
  "title_fr": "Titre traduit en français (clair et concis)",
  "organization_fr": "Nom de l'organisation en français",
  "deadline": "Date limite YYYY-MM-DD ou null si non trouvée",
  "postes": nombre_entier_ou_null,
  "niveau": "Bac / Bac+2 / Bac+3 / Licence / Master / Ingénieur / Tous niveaux / null",
  "meta_title": "Titre SEO en français (max 60 caractères)",
  "meta_description": "Description SEO en français (max 155 caractères)",
  "summary_fr": "Résumé en français du concours (2-3 phrases claires pour les candidats)",
  "analysis_fr": "Analyse originale de 200 à 300 mots en français : de quoi s'agit-il, qui peut postuler, documents requis, conseils pratiques. Ne recopie jamais le contenu source — rédige un texte nouveau et utile.",
  "faq": [
    { "q": "Question 1 spécifique à ce concours", "a": "Réponse claire et pratique" },
    { "q": "Question 2 spécifique à ce concours", "a": "Réponse claire et pratique" },
    { "q": "Question 3 spécifique à ce concours", "a": "Réponse claire et pratique" }
  ]
}`;
  }

  return `Tu es un assistant spécialisé dans les concours de la fonction publique marocaine.

Voici un concours déjà en français (source officielle) :
Titre : ${rec.title_fr}
Organisation : ${rec.organization_fr}
Postes : ${rec.postes ?? 'non précisé'}
Spécialités/Grade : ${(rec.specialites || []).join(', ') || 'non précisé'}
Date limite de dépôt : ${rec.deadline ?? 'non précisée'}
Date du concours : ${rec.date_concours ?? 'non précisée'}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown) avec ces champs :
{
  "niveau": "Bac / Bac+2 / Bac+3 / Licence / Master / Ingénieur / Tous niveaux / null — déduis-le du grade/spécialité si possible, sinon null",
  "meta_title": "Titre SEO en français (max 60 caractères)",
  "meta_description": "Description SEO en français (max 155 caractères)",
  "summary_fr": "Résumé en français du concours (2-3 phrases claires pour les candidats)",
  "analysis_fr": "Analyse originale de 200 à 300 mots en français : de quoi s'agit-il, qui peut postuler, documents requis, conseils pratiques. Ne recopie jamais le contenu source — rédige un texte nouveau et utile.",
  "faq": [
    { "q": "Question 1 spécifique à ce concours", "a": "Réponse claire et pratique" },
    { "q": "Question 2 spécifique à ce concours", "a": "Réponse claire et pratique" },
    { "q": "Question 3 spécifique à ce concours", "a": "Réponse claire et pratique" }
  ]
}`;
}

/** Enriches one common-shape record. Never throws — returns a best-effort fallback on failure. */
export async function enrichWithClaude(rec) {
  const needsTranslation = !rec.title_fr && !!rec.title_ar;

  try {
    const res = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1400,
      messages: [{ role: 'user', content: buildPrompt(rec) }],
    });
    const enrichment = parseJsonResponse(res.content[0].text);

    return {
      title_fr: enrichment.title_fr || rec.title_fr || rec.title_ar,
      organization_fr: enrichment.organization_fr || rec.organization_fr || rec.organization_ar,
      deadline: enrichment.deadline ?? rec.deadline ?? null,
      postes: enrichment.postes ?? rec.postes ?? null,
      niveau: enrichment.niveau ?? rec.niveau ?? null,
      meta_title: enrichment.meta_title || '',
      meta_description: enrichment.meta_description || '',
      summary_fr: enrichment.summary_fr || '',
      analysis_fr: enrichment.analysis_fr || '',
      faq: Array.isArray(enrichment.faq) ? enrichment.faq.slice(0, 3) : [],
      failed: false,
    };
  } catch (err) {
    return {
      title_fr: rec.title_fr || rec.title_ar,
      organization_fr: rec.organization_fr || rec.organization_ar,
      deadline: rec.deadline ?? null,
      postes: rec.postes ?? null,
      niveau: rec.niveau ?? null,
      meta_title: (rec.title_fr || rec.title_ar || '').slice(0, 60),
      meta_description: (rec.content_ar || '').slice(0, 155),
      summary_fr: '',
      analysis_fr: '',
      faq: [],
      failed: true,
      error: err.message,
      _needsTranslation: needsTranslation,
    };
  }
}
