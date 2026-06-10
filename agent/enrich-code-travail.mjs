/**
 * Enrichissement des 70 articles du Code du Travail marocain.
 * Génère pour chaque article :
 *   - faq      : 2-3 Q&A en français (pour FAQPage JSON-LD + accordion page)
 *   - faq_ar   : 2-3 Q&A en arabe
 *   - concretement : 2-3 phrases plain français expliquant l'impact réel
 *   - related  : IDs des 3-4 articles les plus liés sémantiquement
 *
 * Usage :  node enrich-code-travail.mjs [--test]
 * --test : traite uniquement les 3 premiers articles
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import Anthropic from '@anthropic-ai/sdk';
import { config as dotenvConfig } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env') });

const TEST_MODE = process.argv.includes('--test');
const DATA_DIR  = path.join(__dirname, '../data');
const OUT_PATH  = path.join(DATA_DIR, 'code-travail-enriched.json');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const articlesFr = await fs.readJson(path.join(DATA_DIR, 'code-travail.json'));
const articlesAr = await fs.readJson(path.join(DATA_DIR, 'code-travail-ar.json'));

// Build a quick index for related-article lookup
const arById = Object.fromEntries(articlesAr.map(a => [a.id, a]));
const frByTheme = {};
for (const a of articlesFr) {
  (frByTheme[a.theme] = frByTheme[a.theme] || []).push(a.id);
}

function sameThemeIds(article) {
  return (frByTheme[article.theme] || []).filter(id => id !== article.id);
}

// Semantically close articles — hand-coded for the most important
const SEMANTIC_RELATED = {
  'art-52': ['art-53', 'art-43', 'art-44', 'art-74'],
  'art-53': ['art-52', 'art-43', 'art-44', 'art-74'],
  'art-43': ['art-44', 'art-52', 'art-53', 'art-63'],
  'art-44': ['art-43', 'art-52', 'art-53', 'art-63'],
  'art-74': ['art-52', 'art-53', 'art-43'],
  'art-63': ['art-43', 'art-44', 'art-52', 'art-53'],
  'art-16': ['art-17', 'art-18', 'art-19', 'art-13'],
  'art-17': ['art-16', 'art-18', 'art-19', 'art-13'],
  'art-18': ['art-16', 'art-17', 'art-19'],
  'art-19': ['art-16', 'art-17', 'art-18'],
  'art-13': ['art-14', 'art-16', 'art-17'],
  'art-14': ['art-13', 'art-16', 'art-17'],
  'art-24': ['art-25', 'art-26', 'art-34', 'art-35'],
  'art-25': ['art-24', 'art-26', 'art-34', 'art-35'],
  'art-26': ['art-24', 'art-25', 'art-34'],
  'art-34': ['art-35', 'art-24', 'art-25'],
  'art-35': ['art-34', 'art-37', 'art-38'],
  'art-196': ['art-197', 'art-205', 'art-224'],
  'art-197': ['art-196', 'art-205'],
  'art-205': ['art-196', 'art-197', 'art-224'],
  'art-430': ['art-432', 'art-434', 'art-436'],
  'art-432': ['art-430', 'art-434', 'art-436'],
  'art-434': ['art-430', 'art-432', 'art-436'],
  'art-436': ['art-430', 'art-432', 'art-434'],
};

function getRelated(article) {
  const manual = SEMANTIC_RELATED[article.id];
  if (manual) return manual.slice(0, 4);
  return sameThemeIds(article).slice(0, 4);
}

async function enrichArticle(fr, ar) {
  const prompt = `Tu es un expert en droit du travail marocain. Tu dois enrichir cet article du Code du Travail marocain.

Article ${fr.numero} — ${fr.titre}
Thème : ${fr.theme}
Texte officiel : "${fr.texte}"
Résumé : ${fr.resume}

Génère une réponse JSON avec exactement ces champs :

{
  "concretement": "2-3 phrases en français simple, sans jargon juridique, expliquant ce que cet article change concrètement pour un salarié ou employeur au Maroc. Si pertinent, donne un exemple chiffré (salaire, durée). Maximum 80 mots.",
  "faq": [
    { "q": "Question naturelle qu'un salarié ou employeur marocain poserait sur cet article", "a": "Réponse claire en 1-2 phrases, 30-60 mots." },
    { "q": "Deuxième question différente de la première", "a": "Réponse claire en 1-2 phrases." },
    { "q": "Troisième question pratique optionnelle", "a": "Réponse claire." }
  ],
  "faq_ar": [
    { "q": "نفس السؤال الأول بالعربية", "a": "إجابة واضحة بالعربية." },
    { "q": "السؤال الثاني بالعربية", "a": "إجابة." },
    { "q": "السؤال الثالث بالعربية", "a": "إجابة." }
  ]
}

IMPORTANT :
- faq doit avoir exactement 3 objets
- faq_ar doit avoir exactement 3 objets (traduction fidèle des faq)
- concretement doit être utile et pratique, pas une reformulation du texte officiel
- Réponds UNIQUEMENT avec le JSON, aucun texte autour`;

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1100,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = resp.content[0].text.trim();
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastErr;
}

async function main() {
  // Load existing enriched data if any (for resuming)
  let existing = {};
  if (await fs.pathExists(OUT_PATH)) {
    const arr = await fs.readJson(OUT_PATH);
    for (const e of arr) existing[e.id] = e;
  }

  const toProcess = TEST_MODE ? articlesFr.slice(0, 3) : articlesFr;
  let processed = 0, failed = 0;

  for (const fr of toProcess) {
    if (existing[fr.id]) {
      console.log(`[SKIP] Art. ${fr.numero} — already enriched`);
      continue;
    }

    const ar = arById[fr.id];
    try {
      console.log(`[ENRICH] Art. ${fr.numero} — ${fr.titre}…`);
      const enriched = await enrichArticle(fr, ar);

      existing[fr.id] = {
        id: fr.id,
        concretement: enriched.concretement,
        faq: enriched.faq,
        faq_ar: enriched.faq_ar,
        related: getRelated(fr),
      };

      // Save after each article (safe resume)
      await fs.writeJson(OUT_PATH, Object.values(existing), { spaces: 2 });
      processed++;
      console.log(`  ✓ faq:${enriched.faq.length} faq_ar:${enriched.faq_ar.length} concretement:${enriched.concretement.length}ch`);

      // Avoid rate limit
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`  ✗ ERREUR Art. ${fr.numero}: ${err.message}`);
      failed++;
    }
  }

  const total = Object.values(existing).length;
  console.log(`\nTerminé : ${processed} enrichis, ${failed} échoués, ${total} total dans ${OUT_PATH}`);
}

main().catch(err => { console.error(err); process.exit(1); });
