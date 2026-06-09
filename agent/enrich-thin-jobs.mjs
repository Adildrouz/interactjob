/**
 * One-off enrichment pass to fix Google AdSense "low value content".
 *
 * For every ACTIVE job whose original editorial content (hr_commentary) is under
 * ~200 words, regenerate a substantial, ORIGINAL "Analyse RH InteractJob" of
 * 230-260 words split into 2-3 paragraphs. This pushes every indexable job page
 * well beyond 250 words of unique value on top of the scraped description.
 *
 * Also refreshes meta_title / meta_description when missing so every page has a
 * unique title + description.
 *
 * Usage:
 *   node enrich-thin-jobs.mjs --test     # process only 2 jobs, no save
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
const MIN_WORDS = 200;          // enrich anything below this
const TARGET_DESC = 'entre 230 et 260 mots, répartis en 2 ou 3 paragraphes séparés par une ligne vide';

function wc(s) { return s ? String(s).trim().split(/\s+/).filter(Boolean).length : 0; }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const SYSTEM_PROMPT =
  "Tu es Adil Drouz, consultant RH expert au Maroc avec 8 ans d'expérience, rédacteur en chef d'InteractJob.ma. " +
  "Tu écris une analyse RH ORIGINALE et utile, jamais une simple reformulation de l'annonce. " +
  "Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant ou après.";

function buildPrompt(job) {
  const desc = (job.description || '').slice(0, 700);
  const reqs = (job.requirements || []).join(' · ').slice(0, 300);
  return (
    `Poste: ${job.title}\n` +
    `Entreprise: ${job.company}\n` +
    `Ville: ${job.city}\n` +
    `Secteur: ${job.sector}\n` +
    `Type de contrat: ${job.contractType}\n` +
    `Description (source, ne pas recopier): ${desc}\n` +
    `Exigences: ${reqs}\n\n` +
    `Rédige une analyse RH originale pour la page de cette offre. Retourne ce JSON exact:\n` +
    `{\n` +
    `  "hr_commentary": "Analyse RH de ${TARGET_DESC}. Couvre concrètement: (1) le contexte du secteur ${job.sector} et du marché de l'emploi à ${job.city}/au Maroc, (2) les missions et le quotidien réels de ce poste, (3) le profil idéal et les compétences qui font la différence, (4) les perspectives d'évolution de carrière, (5) un conseil concret pour réussir sa candidature via InteractJob. Ton professionnel, concret, en français, valeur ajoutée réelle pour le candidat. NE PAS recopier la description.",\n` +
    `  "meta_title": "max 60 caractères, avec le poste et la ville",\n` +
    `  "meta_description": "max 155 caractères, accrocheur, avec le type de contrat et la ville"\n` +
    `}`
  );
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY manquant'); process.exit(1);
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const raw = fs.readFileSync(JOBS_PATH, 'utf8');
  const jobs = JSON.parse(raw);

  let candidates = jobs.filter((j) => !j.expired && wc(j.hr_commentary) < MIN_WORDS);
  if (TEST) candidates = candidates.slice(0, 2);

  console.log(`[enrich] ${candidates.length} offres à enrichir (test=${TEST})`);

  let done = 0, failed = 0;
  let tokIn = 0, tokOut = 0;

  for (let i = 0; i < candidates.length; i++) {
    const job = candidates[i];
    try {
      const res = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(job) }],
      });
      tokIn += res.usage?.input_tokens || 0;
      tokOut += res.usage?.output_tokens || 0;

      const text = (res.content[0]?.text || '').trim()
        .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const enr = JSON.parse(text);

      if (typeof enr.hr_commentary !== 'string' || wc(enr.hr_commentary) < 150) {
        throw new Error(`hr_commentary trop court (${wc(enr.hr_commentary)}w)`);
      }

      // Mutate the original object in the jobs array (job is a reference into jobs)
      job.hr_commentary = enr.hr_commentary.trim();
      if (enr.meta_title)       job.meta_title = String(enr.meta_title).slice(0, 65);
      if (enr.meta_description) job.meta_description = String(enr.meta_description).slice(0, 160);

      done++;
      console.log(`  ✓ [${i + 1}/${candidates.length}] ${job.title.slice(0, 40)} — ${wc(job.hr_commentary)}w`);
    } catch (err) {
      failed++;
      console.log(`  ✗ [${i + 1}/${candidates.length}] ${job.title.slice(0, 40)} — ${err.message}`);
    }
    if (i < candidates.length - 1) await sleep(450);
  }

  console.log(`[enrich] terminé: ${done} ok, ${failed} échec — tokens ${tokIn} in / ${tokOut} out`);

  if (!TEST && done > 0) {
    // Backup then write
    fs.writeFileSync(JOBS_PATH + '.bak', raw, 'utf8');
    fs.writeFileSync(JOBS_PATH, JSON.stringify(jobs, null, 4) + '\n', 'utf8');
    console.log(`[enrich] data/jobs.json mis à jour (backup: jobs.json.bak)`);
  } else {
    console.log('[enrich] (test/aucun changement) — fichier non modifié');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
