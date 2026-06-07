#!/usr/bin/env node
/**
 * Helper script to manually update LinkedIn weekly stats.
 *
 * Usage:
 *   node agent/update-linkedin-stats.js \
 *     --followers_page=18700 \
 *     --followers_adil=20200 \
 *     --impressions_7j=120000 \
 *     --membres_touches=28000 \
 *     --engagement=600 \
 *     --enregistrements=150 \
 *     --envois=80 \
 *     --nouveaux_abonnes_page=70 \
 *     --nouveaux_abonnes_adil=150 \
 *     --top_post_impressions=18000 \
 *     --top_post_titre="Titre du meilleur post"
 *
 * Run with no args to just display current values.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const LINKEDIN_PATH = path.join(__dirname, 'data', 'linkedin-weekly.json');

const KNOWN_KEYS = [
  'followers_page', 'followers_adil',
  'impressions_7j', 'membres_touches',
  'engagement', 'enregistrements', 'envois',
  'nouveaux_abonnes_page', 'nouveaux_abonnes_adil',
  'top_post_impressions', 'top_post_titre',
];

async function main() {
  await fs.ensureDir(path.join(__dirname, 'data'));

  // Load current values
  let current = {};
  if (await fs.pathExists(LINKEDIN_PATH)) {
    current = await fs.readJson(LINKEDIN_PATH);
    console.log('\n📊 Valeurs actuelles (semaine: ' + (current.week || 'N/D') + '):');
    console.table(
      Object.fromEntries(KNOWN_KEYS.map((k) => [k, current[k] ?? 'N/D']))
    );
  } else {
    console.log('ℹ️  Fichier linkedin-weekly.json introuvable — il sera créé.');
  }

  // Parse --key=value args
  const args    = process.argv.slice(2);
  const updates = {};

  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (!match) { console.warn(`⚠️  Argument ignoré: ${arg}`); continue; }
    const [, key, raw] = match;
    if (!KNOWN_KEYS.includes(key)) {
      console.warn(`⚠️  Clé inconnue ignorée: ${key}`);
      continue;
    }
    updates[key] = isNaN(raw) || raw === '' ? raw : Number(raw);
  }

  if (Object.keys(updates).length === 0) {
    console.log('\n💡 Aucune mise à jour. Passez des arguments pour modifier les valeurs.');
    console.log('   Exemple: node update-linkedin-stats.js --followers_page=18700 --nouveaux_abonnes_page=70');
    return;
  }

  const updated = {
    ...current,
    ...updates,
    week: new Date().toISOString().split('T')[0],
  };

  await fs.writeJson(LINKEDIN_PATH, updated, { spaces: 2 });

  console.log('\n✅ Stats LinkedIn mises à jour (semaine: ' + updated.week + '):');
  const diff = {};
  for (const k of KNOWN_KEYS) {
    const before = current[k] ?? 'N/D';
    const after  = updated[k] ?? 'N/D';
    diff[k] = before === after ? after : `${before} → ${after}`;
  }
  console.table(diff);
}

main().catch((err) => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
