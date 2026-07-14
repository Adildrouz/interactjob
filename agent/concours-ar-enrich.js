/**
 * Concours — Arabic (MSA) AI enrichment.
 *
 * Generates the Arabic-locale fields the /ar/concours pages need but the
 * live scraper's French enrichment (concours-parser.js, Haiku) never
 * produces: organization_ar (missing on ~19% of records), summary_ar,
 * meta_title_ar, meta_description_ar. title_ar/content_ar already exist for
 * every record (raw scraped Arabic source) and are NOT touched here.
 *
 * Uses Claude Sonnet (not Haiku) — this is user-facing editorial MSA content,
 * not a French-only enrichment pass, so it gets the premium model per the
 * Arabic-optimization mission's translation-quality requirement. The
 * existing French enrichment in concours-parser.js is untouched/out of scope.
 *
 * enrichArabicFields() is the reusable core, imported by:
 *   - this file's own CLI driver below (one-time backfill of existing records)
 *   - concours-parser.js's live per-item loop (ongoing, one new record at a time)
 * so the prompt/model/parsing logic lives in exactly one place.
 *
 * CLI usage (backfill driver — deliberately decoupled from any git feature
 * branch: data/concours.json is mutated directly on `main` several times a
 * day by the live scraper, so this pulls a *fresh* copy from GitHub
 * immediately before processing, same mechanism the live agent uses, and
 * pushes straight back to `main` — never via a branch/PR, which would go
 * stale within hours):
 *   node agent/concours-ar-enrich.js                  # dry run, all records needing enrichment, no writes
 *   node agent/concours-ar-enrich.js --limit 5         # dry run, first 5 only (for spot-checking quality)
 *   node agent/concours-ar-enrich.js --limit 5 --push  # process 5 AND write + push to GitHub main
 *   node agent/concours-ar-enrich.js --push            # full run, writes + pushes to GitHub main
 *   node agent/concours-ar-enrich.js --local           # skip the GitHub pull, use the on-disk file as-is (local testing)
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { log, initLogger } from './logger.js';
import { logTokenUsage } from './token-tracker.js';
import { syncJobsFromGithub, pushToGithub } from './github-sync.js';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const CONCOURS_PATH = path.join(__dirname, '../data/concours.json');
const MODEL         = 'claude-sonnet-5';

let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const SYSTEM_PROMPT =
  "Tu es un rédacteur éditorial spécialisé dans l'arabe standard moderne (فصحى) pour une plateforme d'emploi marocaine. " +
  "N'utilise JAMAIS le darija (dialecte marocain) — toujours un arabe standard moderne clair, professionnel et grammaticalement irréprochable. " +
  "Réponds UNIQUEMENT en JSON valide, aucun texte avant ou après, aucun markdown.";

function buildUserPrompt(c) {
  return (
    `Voici un concours de la fonction publique marocaine :\n` +
    `Titre arabe (source brute) : ${c.title_ar}\n` +
    `Titre français (traduit) : ${c.title_fr}\n` +
    `Organisation (français) : ${c.organization_fr}\n` +
    `Organisation (arabe, éventuellement vide) : ${c.organization_ar || '(vide)'}\n` +
    `Niveau requis : ${c.niveau || 'non précisé'}\n` +
    `Nombre de postes : ${c.postes ?? 'non précisé'}\n` +
    `Contenu source arabe : ${(c.content_ar || '').slice(0, 1500)}\n\n` +
    `Retourne ce JSON exact :\n` +
    `{\n` +
    `  "organization_ar": "Nom de l'organisation en arabe standard moderne, orthographe officielle. Si le champ 'Organisation (arabe)' ci-dessus n'est pas vide, recopie-le tel quel sans le modifier.",\n` +
    `  "summary_ar": "Résumé de 2 à 3 phrases en arabe standard moderne, pour des candidats — pas une traduction littérale du contenu source, une synthèse éditoriale claire et naturelle.",\n` +
    `  "meta_title_ar": "Titre SEO en arabe standard moderne, 60 caractères maximum",\n` +
    `  "meta_description_ar": "Meta description SEO en arabe standard moderne, 155 caractères maximum"\n` +
    `}`
  );
}

function fallback(c) {
  return {
    organization_ar: c.organization_ar || '',
    summary_ar: '',
    meta_title_ar: (c.title_ar || '').slice(0, 60),
    meta_description_ar: (c.content_ar || '').slice(0, 155),
  };
}

export function needsArabicEnrichment(c) {
  return !c.summary_ar || !c.meta_title_ar || !c.meta_description_ar || !c.organization_ar;
}

/**
 * Enrich one concours record with Arabic (MSA) fields. Never throws — on any
 * failure (API error, malformed JSON, missing field) falls back to a
 * degraded-but-non-empty result (same shape as concours-parser.js's existing
 * French-enrichment fallback), so a caller can always merge the result
 * without its own try/catch.
 *
 * Returns { fields, ok, tokens: { input, output } }.
 */
export async function enrichArabicFields(c) {
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 2000, // Sonnet sometimes emits an interleaved thinking block that eats into this budget before the JSON text — 1000 truncated some records during testing
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserPrompt(c) }],
    });

    const tokens = {
      input: response.usage?.input_tokens || 0,
      output: response.usage?.output_tokens || 0,
    };

    // Sonnet may emit a leading "thinking" block before the text block (not
    // always — appears model-decided) — content[0] isn't reliably the text.
    const textBlock = response.content.find((b) => b.type === 'text');
    const text = (textBlock?.text || '').trim();
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const fields = JSON.parse(clean);

    if (typeof fields.summary_ar !== 'string') throw new Error('summary_ar manquant');
    return { fields, ok: true, tokens };
  } catch (err) {
    return { fields: fallback(c), ok: false, error: err.message, tokens: { input: 0, output: 0 } };
  }
}

// ─── CLI backfill driver ────────────────────────────────────────────────
// Only runs when this file is executed directly (`node agent/concours-ar-enrich.js`),
// not when imported by concours-parser.js for the live per-item pipeline call.

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBackfillCli() {
  const __filename = fileURLToPath(import.meta.url);
  if (process.argv[1] !== __filename) return; // imported, not run directly

  dotenvConfig({ path: path.join(__dirname, '.env') });
  initLogger();

  const args      = process.argv.slice(2);
  const DRY_RUN   = !args.includes('--push');
  const SKIP_PULL = args.includes('--local');
  const limitArg  = args.find((a) => a.startsWith('--limit'));
  const LIMIT     = limitArg ? parseInt(args[args.indexOf(limitArg) + 1] || limitArg.split('=')[1], 10) : Infinity;

  if (!process.env.ANTHROPIC_API_KEY) {
    log('Concours AR enrich: ANTHROPIC_API_KEY non défini — abandon');
    process.exit(1);
  }

  if (!SKIP_PULL) {
    log('Concours AR enrich: récupération de la version actuelle de data/concours.json depuis GitHub main...');
    await syncJobsFromGithub();
  } else {
    log('Concours AR enrich: --local — utilisation du fichier local tel quel (pas de pull GitHub)');
  }

  const all = await fs.readJson(CONCOURS_PATH);
  const toProcess = all.filter(needsArabicEnrichment).slice(0, LIMIT);

  log(`Concours AR enrich: ${all.length} enregistrements au total, ${all.filter(needsArabicEnrichment).length} à enrichir, traitement de ${toProcess.length}` +
      (DRY_RUN ? ' (DRY RUN — aucune écriture)' : ' (--push — écriture + push GitHub à la fin)'));

  let enriched = 0, failed = 0;
  let totalTokens = { input: 0, output: 0 };
  const results = [];

  for (let i = 0; i < toProcess.length; i++) {
    const c = toProcess[i];
    const { fields, ok, error, tokens } = await enrichArabicFields(c);
    totalTokens.input += tokens.input;
    totalTokens.output += tokens.output;

    if (ok) enriched++;
    else { failed++; log(`  ⚠ Claude fallback pour "${c.slug}": ${error}`); }

    c.organization_ar = fields.organization_ar || c.organization_ar || '';
    c.summary_ar = fields.summary_ar || '';
    c.meta_title_ar = fields.meta_title_ar || '';
    c.meta_description_ar = fields.meta_description_ar || '';

    results.push({ slug: c.slug, title_fr: c.title_fr, ...fields });

    if (i < toProcess.length - 1) await sleep(500);
  }

  await logTokenUsage('concours-ar-enrich', totalTokens.input, totalTokens.output);
  log(`Concours AR enrich: ${enriched} enrichis, ${failed} échoués (fallback). ${totalTokens.input} tokens entrée + ${totalTokens.output} tokens sortie.`);

  if (DRY_RUN) {
    log('Concours AR enrich: DRY RUN — aperçu des résultats :');
    console.log(JSON.stringify(results, null, 2));
    log('Concours AR enrich: aucune écriture effectuée. Relancer avec --push pour écrire + pousser vers GitHub main.');
    return;
  }

  await fs.writeJson(CONCOURS_PATH, all, { spaces: 2 });
  await pushToGithub(
    `chore(concours): AI-generate Arabic enrichment (${enriched} records) [skip ci]`,
    ['data/concours.json']
  );
  log(`Concours AR enrich: ✓ ${toProcess.length} enregistrement(s) mis à jour et poussés vers GitHub main.`);
}

runBackfillCli().catch((err) => {
  log(`Concours AR enrich: ERREUR FATALE — ${err.message}`);
  process.exit(1);
});
