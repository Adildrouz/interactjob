/**
 * Deuxième passe : ajoute le champ `analyse` à chaque article enrichi.
 * `analyse` = analyse juridique de 120-150 mots expliquant :
 *   - Le contexte légal dans lequel s'applique l'article
 *   - Les obligations concrètes pour l'employeur ET le salarié
 *   - Les sanctions ou conséquences en cas de non-respect (si pertinent)
 * Sauvegarde dans data/code-travail-enriched.json (champ ajouté in-place).
 *
 * Usage : node enrich-code-travail-analyse.mjs [--test]
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
const existing = await fs.readJson(OUT_PATH);
const byId = Object.fromEntries(existing.map(e => [e.id, e]));

async function generateAnalyse(fr) {
  const prompt = `Tu es un expert en droit du travail marocain. Rédige une analyse juridique de l'article ${fr.numero} du Code du Travail marocain (Loi n° 65-99).

Article ${fr.numero} — ${fr.titre}
Thème : ${fr.theme}
Texte officiel : "${fr.texte}"
Résumé : ${fr.resume}

Rédige un paragraphe d'analyse de 120 à 150 mots qui explique :
1. Le contexte légal et l'objectif de cet article dans le cadre du Code du Travail
2. Les obligations concrètes qu'il impose à l'employeur et/ou au salarié
3. Les conséquences pratiques ou sanctions en cas de non-respect (si applicable)

Style : professionnel mais accessible, sans jargon excessif. Utile pour un DRH ou un chef d'entreprise au Maroc.
Réponds UNIQUEMENT avec le texte du paragraphe, sans titre, sans guillemets, sans JSON.`;

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      });
      const text = resp.content[0].text.trim();
      if (text.length > 100) return text;
      throw new Error('Réponse trop courte: ' + text.length);
    } catch (e) {
      lastErr = e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastErr;
}

async function main() {
  const toProcess = TEST_MODE ? articlesFr.slice(0, 3) : articlesFr;
  let processed = 0, skipped = 0, failed = 0;

  for (const fr of toProcess) {
    const entry = byId[fr.id];
    if (!entry) { console.log(`[SKIP] Art. ${fr.numero} — not in enriched data`); skipped++; continue; }
    if (entry.analyse && entry.analyse.length > 100) {
      console.log(`[SKIP] Art. ${fr.numero} — analyse already present`);
      skipped++;
      continue;
    }

    try {
      console.log(`[ANALYSE] Art. ${fr.numero} — ${fr.titre}…`);
      const analyse = await generateAnalyse(fr);
      entry.analyse = analyse;
      // Save after each article
      await fs.writeJson(OUT_PATH, Object.values(byId), { spaces: 2 });
      processed++;
      console.log(`  ✓ ${analyse.split(/\s+/).length} mots`);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ ERREUR Art. ${fr.numero}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nTerminé : ${processed} analysés, ${skipped} skippés, ${failed} échoués`);
}

main().catch(err => { console.error(err); process.exit(1); });
