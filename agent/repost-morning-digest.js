/**
 * Efface le post matin d'aujourd'hui et le republier avec le nouveau format
 * (6 offres avec lien individuel par poste).
 *
 * Usage : node repost-morning-digest.js
 * Lancer depuis la racine du projet ou depuis agent/
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { log, initLogger } from './logger.js';
import { generateLinkedInDigests, postDigestByLabel } from './linkedin-digests.js';
import { pushToGithub } from './github-sync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const PUBLISHED_PATH = path.join(__dirname, '../data/published-posts.json');
const QUEUE_PATH     = path.join(__dirname, '../data/linkedin-queue.txt');

const TODAY = new Date().toISOString().split('T')[0];

// Labels à réinitialiser (toute la journée, pour que la regénération recréé les 3 slots)
const LABELS_TO_RESET = [
  '08:00 OFFRES MATIN',
  '10:00 OFFRES MID',
  '12:00 OFFRES MIDI',
];

async function main() {
  initLogger();
  log('=== Repost Morning Digest ===');
  log(`Date : ${TODAY}`);

  // ── 1. Supprimer les clés dedup des posts du matin ─────────────────────────
  const published = fs.existsSync(PUBLISHED_PATH)
    ? fs.readJsonSync(PUBLISHED_PATH)
    : {};

  let removedKeys = 0;
  for (const label of LABELS_TO_RESET) {
    const key = `${TODAY}|${label}`;
    if (published[key]) {
      log(`Suppression dedup : "${key}"`);
      delete published[key];
      removedKeys++;
    }
  }

  if (removedKeys > 0) {
    fs.writeJsonSync(PUBLISHED_PATH, published, { spaces: 2 });
    log(`${removedKeys} clé(s) dedup supprimée(s)`);
  } else {
    log('Aucune clé dedup trouvée pour aujourd\'hui — continue quand même');
  }

  // ── 2. Supprimer la section d'aujourd'hui dans la queue ────────────────────
  if (fs.existsSync(QUEUE_PATH)) {
    const content = fs.readFileSync(QUEUE_PATH, 'utf-8');
    const fence = '='.repeat(26);
    const fenceStart = `${fence} [${TODAY}] ${fence}`;
    const startIdx = content.indexOf(fenceStart);

    if (startIdx >= 0) {
      // Trouver la prochaine fence ou fin de fichier
      const afterFence = startIdx + fenceStart.length + 10;
      const endIdx = content.indexOf(fence, afterFence);
      const endPos = endIdx > 0 ? endIdx + fence.length : content.length;

      const cleaned = content.slice(0, startIdx) + content.slice(endPos);
      fs.writeFileSync(QUEUE_PATH, cleaned.replace(/\n{3,}/g, '\n\n'), 'utf-8');
      log('Section queue d\'aujourd\'hui effacée');
    } else {
      log('Aucune section queue trouvée pour aujourd\'hui');
    }
  }

  // ── 3. Persister l'état nettoyé sur GitHub ─────────────────────────────────
  try {
    await pushToGithub('chore: reset morning digest dedup [skip ci]');
    log('État nettoyé poussé sur GitHub');
  } catch (err) {
    log(`Push GitHub échoué (non bloquant) — ${err.message}`);
  }

  // ── 4. Regénérer la queue avec le nouveau format ───────────────────────────
  log('Regénération de la queue avec le nouveau format (liens individuels)...');
  await generateLinkedInDigests([]);

  // ── 5. Publier immédiatement le post 08:00 ─────────────────────────────────
  log('Publication du post 08:00 OFFRES MATIN...');
  await postDigestByLabel('08:00 OFFRES MATIN');

  log('=== Terminé ✅ ===');
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  process.exit(1);
});
