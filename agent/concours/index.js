/**
 * Concours orchestrator — runs every configured source adapter, dedupes
 * across sources, enriches new records via Claude Haiku, and writes the
 * result straight to MongoDB (no more data/concours.json + git commit for
 * concours — Mongo is the source of truth, read live by the Next.js pages).
 *
 * Returns { added, total, newItems } — same shape the old
 * concours-parser.js's fetchConcours() returned, so agent.js's IndexNow step
 * keeps working unchanged.
 */

import { connectConcoursCollection } from '../db-concours.js';
import { runAdapter } from './base-adapter.js';
import { emploiPublicAdapter } from './adapters/emploi-public.js';
import { alwadifaAdapter } from './adapters/alwadifa.js';
import { collapseBatch, matchAgainstExisting } from './dedupe.js';
import { enrichWithClaude } from './enrich.js';
import { log } from '../logger.js';
import { pathToFileURL } from 'url';

const ADAPTERS = [emploiPublicAdapter, alwadifaAdapter];
const MAX_NEW_PER_SOURCE = 15;

const EXISTING_PROJECTION = {
  organization_fr: 1, organization_ar: 1, title_fr: 1, title_ar: 1, deadline: 1,
  source: 1, source_url: 1, source_urls: 1, slug: 1, sourceId: 1,
};

function makeSlug(title, sourceId) {
  const base = (title || 'concours')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base}-${sourceId}`;
}

export async function fetchConcours() {
  log('Concours: démarrage du scraping multi-sources (emploi-public.ma, alwadifa-maroc.com)');

  const { client, col } = await connectConcoursCollection();
  try {
    const existingDocs = await col.find({}, { projection: EXISTING_PROJECTION }).toArray();
    const existingSlugs = new Set(existingDocs.map((d) => d.slug).filter(Boolean));

    // Track known sourceIds per source, so each adapter only fetches genuinely new items.
    const existingIdsBySource = new Map();
    for (const doc of existingDocs) {
      if (!existingIdsBySource.has(doc.source)) existingIdsBySource.set(doc.source, new Set());
      existingIdsBySource.get(doc.source).add(doc.sourceId);
    }

    const rawRecords = [];
    const perSourceStats = {};

    for (const adapter of ADAPTERS) {
      const existingIds = existingIdsBySource.get(adapter.name) || new Set();
      const { added, failed } = await runAdapter(adapter, existingIds, { maxNew: MAX_NEW_PER_SOURCE });
      rawRecords.push(...added);
      perSourceStats[adapter.name] = { new: added.length, failed };
      log(`Concours[${adapter.name}]: ${added.length} nouveaux, ${failed} échoués`);
    }

    if (rawRecords.length === 0) {
      log('Concours: aucun nouveau concours sur aucune source');
      await updateExpired(col);
      return { added: 0, total: existingDocs.length, newItems: [], perSourceStats };
    }

    const collapsed = collapseBatch(rawRecords);
    const { toInsert, toUpdate } = matchAgainstExisting(collapsed, existingDocs);

    log(`Concours: ${rawRecords.length} bruts → ${collapsed.length} après fusion intra-run → ${toInsert.length} nouveaux, ${toUpdate.length} déjà connus (mise à jour des sources)`);

    // Cheap merge: existing concours re-seen on another source — just union source_urls.
    for (const upd of toUpdate) {
      await col.updateOne(
        { _id: upd._id },
        { $set: {
          source: upd.source, source_url: upd.source_url, source_urls: upd.source_urls,
          title_ar: upd.title_ar, organization_ar: upd.organization_ar, content_ar: upd.content_ar,
        } },
      );
    }

    const newItems = [];
    let enrichedCount = 0, failedCount = 0;

    for (const rec of toInsert) {
      const enrichment = await enrichWithClaude(rec);
      if (enrichment.failed) failedCount++; else enrichedCount++;

      let slug = makeSlug(enrichment.title_fr, rec.sourceId);
      let suffix = 2;
      while (existingSlugs.has(slug)) { slug = `${makeSlug(enrichment.title_fr, rec.sourceId)}-${suffix++}`; }
      existingSlugs.add(slug);

      const doc = {
        sourceId: String(rec.sourceId),
        source: rec.source,
        source_url: rec.source_url,
        source_urls: rec.source_urls || [rec.source_url],
        organisme_website: rec.organisme_website || null,
        organization_fr: enrichment.organization_fr || '',
        organization_ar: rec.organization_ar || '',
        title_fr: enrichment.title_fr || '',
        title_ar: rec.title_ar || '',
        slug,
        datePosted: rec.datePosted || null,
        deadline: enrichment.deadline,
        date_concours: rec.date_concours || null,
        postes: enrichment.postes,
        niveau: enrichment.niveau,
        specialites: rec.specialites || [],
        content_ar: rec.content_ar || '',
        summary_fr: enrichment.summary_fr,
        analysis_fr: enrichment.analysis_fr,
        faq: enrichment.faq,
        meta_title: enrichment.meta_title,
        meta_description: enrichment.meta_description,
        status: enrichment.deadline && new Date(enrichment.deadline).getTime() < Date.now() ? 'expired' : 'active',
        scraped_at: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await col.insertOne(doc);
      newItems.push(doc);
    }

    await updateExpired(col);

    const total = await col.countDocuments();
    log(`Concours: ${enrichedCount} enrichis, ${failedCount} échoués. ${newItems.length} ajoutés. Total: ${total}`);
    return { added: newItems.length, total, newItems, perSourceStats };
  } finally {
    await client.close();
  }
}

/** Auto-expire: flip status to "expired" once date_cloture has passed. */
async function updateExpired(col) {
  const today = new Date().toISOString().split('T')[0];
  const res = await col.updateMany(
    { status: 'active', deadline: { $ne: null, $lt: today } },
    { $set: { status: 'expired' } },
  );
  if (res.modifiedCount > 0) log(`Concours: ${res.modifiedCount} concours passés en "expired"`);
}

// Standalone runner for local testing: `node agent/concours/index.js --dev`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { config: dotenvConfig } = await import('dotenv');
  const { fileURLToPath } = await import('url');
  const path = await import('path');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenvConfig({ path: path.join(__dirname, '..', '.env') });        // agent/.env — MONGODB_URI, ANTHROPIC_API_KEY, ...
  dotenvConfig({ path: path.join(__dirname, '..', '..', '.env.local') }); // root .env.local — MONGODB_URI_DEV

  fetchConcours()
    .then((result) => {
      log(`Run terminé — added=${result.added} total=${result.total}`);
      process.exit(0);
    })
    .catch((err) => {
      log(`Run ERREUR — ${err.message}`);
      process.exit(1);
    });
}

