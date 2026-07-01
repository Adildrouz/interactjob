/**
 * Enrichment pass: fix "low value content" on job pages.
 *
 * For every active job with thin content (<200 words ai_analysis),
 * calls Claude Haiku to generate:
 *   - ai_analysis: 300-400 word structured analysis (3 H2 sections)
 *   - ai_faq: 4 unique Q&As specific to this job
 *   - meta_title: unique, 60 chars max
 *   - meta_description: unique, 155 chars max
 *
 * Jobs where description is under 20 words AND Haiku cannot generate
 * meaningful content get thin_content: true → noindex on the page.
 *
 * Usage:
 *   node enrich-thin-jobs.mjs --test     # process only 3 jobs, no save
 *   node enrich-thin-jobs.mjs            # full run, writes ../data/jobs.json
 */
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const JOBS_PATH = path.join(__dirname, '../data/jobs.json');
const TEST = process.argv.includes('--test');
const MIN_WORDS = 200;
const ENRICHMENT_VERSION = 2;

function wc(s) { return s ? String(s).trim().split(/\s+/).filter(Boolean).length : 0; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Best-effort JSON repair + field extraction. */
function safeParseJSON(text) {
  // 1. Try direct parse first
  try { return JSON.parse(text); } catch (_) {}
  // 2. Replace smart quotes and control chars
  const clean = text
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  try { return JSON.parse(clean); } catch (_) {}
  // 3. Try to extract individual string fields via regex (handles truncated JSON)
  const result = {};
  const strField = (name) => {
    const m = clean.match(new RegExp(`"${name}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').trim() : null;
  };
  result.analyse_poste = strField('analyse_poste');
  result.pourquoi_interessant = strField('pourquoi_interessant');
  result.meta_title = strField('meta_title');
  result.meta_description = strField('meta_description');
  // Extract profil_recherche array
  const prMatch = clean.match(/"profil_recherche"\s*:\s*\[([\s\S]*?)\]/);
  if (prMatch) {
    try {
      result.profil_recherche = JSON.parse('[' + prMatch[1] + ']');
    } catch (_) {
      result.profil_recherche = [];
    }
  }
  // Extract faq array (may be truncated, grab what we can)
  const faqStart = clean.indexOf('"faq"');
  if (faqStart !== -1) {
    const faqStr = clean.slice(faqStart);
    const items = [...faqStr.matchAll(/\{"q"\s*:\s*"([^"]+)"\s*,\s*"a"\s*:\s*"([^"]+)"\}/g)];
    if (items.length >= 2) result.faq = items.map((m) => ({ q: m[1], a: m[2] }));
  }
  if (result.analyse_poste) return result;
  throw new Error('JSON unrecoverable');
}

const SYSTEM_PROMPT =
  "Tu es un expert RH marocain rédigeant pour InteractJob.ma, le premier job board marocain. " +
  "Tu écris des analyses concrètes et utiles, jamais des textes génériques. " +
  "Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.";

function buildPrompt(job) {
  const desc = (job.description || '').slice(0, 800);
  const reqs = (job.requirements || []).join(' · ').slice(0, 200);

  return (
    `Poste: ${job.title}\n` +
    `Entreprise: ${job.company}\n` +
    `Ville: ${job.city}\n` +
    `Secteur: ${job.sector}\n` +
    `Contrat: ${job.contractType}\n` +
    `Description: ${desc || 'Non fournie'}\n` +
    `Exigences: ${reqs || 'Non précisées'}\n\n` +
    `Génère une analyse RH spécifique à CE poste. JSON strict, toutes les valeurs en une seule ligne (pas de retour à la ligne dans les strings):\n` +
    `{"analyse_poste":"2-3 phrases concrètes sur le quotidien réel de CE poste ${job.title} (pas générique)","profil_recherche":["compétence spécifique 1 pour ${job.title}","compétence spécifique 2","compétence spécifique 3","soft skill clé pour le secteur ${job.sector}"],"pourquoi_interessant":"2-3 phrases sur la valeur réelle de CETTE offre chez ${job.company} à ${job.city}: réputation entreprise si connue, croissance du secteur, évolution de carrière","faq":[{"q":"Comment postuler chez ${job.company} pour ce poste?","a":"réponse spécifique avec étapes concrètes"},{"q":"Quelles qualifications pour un ${job.title}?","a":"réponse basée sur le profil requis"},{"q":"Quel salaire pour un ${job.title} à ${job.city}?","a":"fourchette réaliste au Maroc en MAD"},{"q":"Quelles perspectives d'évolution pour un ${job.title} au Maroc?","a":"débouchés concrets dans le secteur ${job.sector}"}],"meta_title":"max 60 chars: ${job.title} chez ${job.company} ${job.city}","meta_description":"max 155 chars: aspect le plus convaincant de CETTE offre"}`
  );
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY manquant'); process.exit(1);
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const raw = fs.readFileSync(JOBS_PATH, 'utf8');
  const jobs = JSON.parse(raw);

  // Candidates: active jobs without sufficient ai_analysis
  let candidates = jobs.filter(
    (j) => !j.expired &&
    (wc(j.ai_analysis) < MIN_WORDS || (j.enrichment_version || 0) < ENRICHMENT_VERSION)
  );
  if (TEST) candidates = candidates.slice(0, 3);

  console.log(`[enrich] ${candidates.length} offres à enrichir (test=${TEST})`);

  let done = 0, failed = 0, thin = 0;
  let tokIn = 0, tokOut = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < candidates.length; i++) {
    const job = candidates[i];
    const descWords = wc(job.description);

    try {
      const res = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(job) }],
      });
      tokIn += res.usage?.input_tokens || 0;
      tokOut += res.usage?.output_tokens || 0;

      const text = (res.content[0]?.text || '').trim()
        .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const enr = safeParseJSON(text);

      // Assemble ai_analysis from flat fields
      const analysisParts = [
        enr.analyse_poste ? `## Analyse du poste\n${enr.analyse_poste}` : '',
        Array.isArray(enr.profil_recherche) && enr.profil_recherche.length
          ? `## Profil recherché\n${enr.profil_recherche.map((b) => `• ${b}`).join('\n')}`
          : '',
        enr.pourquoi_interessant ? `## Pourquoi ce poste est intéressant\n${enr.pourquoi_interessant}` : '',
      ].filter(Boolean);
      const aiAnalysis = analysisParts.join('\n\n');
      const analysisWords = wc(aiAnalysis);

      // If description is empty AND analysis is too thin, mark as thin content
      if (descWords < 20 && analysisWords < 100) {
        job.thin_content = true;
        thin++;
        console.log(`  ⚠ [${i + 1}/${candidates.length}] THIN ${job.title.slice(0, 40)} — noindex`);
      } else {
        delete job.thin_content;

        if (analysisWords < 80) {
          throw new Error(`ai_analysis trop court (${analysisWords}w)`);
        }

        job.ai_analysis = aiAnalysis;
        const rawFaq = enr.faq || enr.ai_faq;
        if (Array.isArray(rawFaq) && rawFaq.length >= 3) {
          job.ai_faq = rawFaq.slice(0, 4).map((item) => ({
            q: String(item.q || '').trim(),
            a: String(item.a || '').trim(),
          })).filter((item) => item.q && item.a);
        }
        if (enr.meta_title) job.meta_title = String(enr.meta_title).slice(0, 65);
        if (enr.meta_description) job.meta_description = String(enr.meta_description).slice(0, 160);

        done++;
        console.log(`  ✓ [${i + 1}/${candidates.length}] ${job.title.slice(0, 40)} — analysis:${analysisWords}w faq:${job.ai_faq?.length || 0}q`);
      }

      job.enriched_at = now;
      job.enrichment_version = ENRICHMENT_VERSION;

    } catch (err) {
      failed++;
      console.log(`  ✗ [${i + 1}/${candidates.length}] ${job.title.slice(0, 40)} — ${err.message}`);
    }

    if (i < candidates.length - 1) await sleep(400);
  }

  console.log(`\n[enrich] terminé: ${done} enrichis, ${thin} thin (noindex), ${failed} échecs`);
  console.log(`[enrich] tokens: ${tokIn} input / ${tokOut} output`);
  const cost = ((tokIn * 0.80 + tokOut * 4.0) / 1_000_000).toFixed(4);
  console.log(`[enrich] coût estimé: $${cost}`);

  if (!TEST && (done + thin) > 0) {
    fs.writeFileSync(JOBS_PATH + '.bak', raw, 'utf8');
    fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 4) + '\n', 'utf8');
    console.log(`[enrich] data/jobs.json mis à jour (backup: jobs.json.bak)`);
  } else {
    console.log('[enrich] (test ou aucun changement) — fichier non modifié');
  }

  // Phase 6 audit
  const allActive = jobs.filter((j) => !j.expired);
  const enriched = allActive.filter((j) => wc(j.ai_analysis) >= 200);
  const withFaq = allActive.filter((j) => j.ai_faq?.length >= 3);
  const thinPages = allActive.filter((j) => j.thin_content);
  console.log(`\n=== AUDIT RAPPORT ===`);
  console.log(`Total pages actives: ${allActive.length}`);
  console.log(`Pages enrichies (200+w analysis): ${enriched.length} (${Math.round(enriched.length/allActive.length*100)}%)`);
  console.log(`Pages avec FAQ unique: ${withFaq.length}`);
  console.log(`Pages thin (noindex): ${thinPages.length}`);
  if (enriched.length > 0) {
    const avgWords = Math.round(enriched.reduce((s, j) => s + wc(j.ai_analysis), 0) / enriched.length);
    console.log(`Moyenne mots par analyse: ${avgWords}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
