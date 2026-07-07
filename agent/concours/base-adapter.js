/**
 * Adapter contract every concours source implements:
 *
 *   {
 *     name:        string,               // e.g. "emploi-public.ma"
 *     baseUrl:     string,                // used to scope robots.txt + politeFetch
 *     fetchListingIds(politeFetch, opts): Promise<string[]>,  // newest-first source ids
 *     fetchDetail(id, politeFetch):       Promise<RawRecord>, // one raw scraped record
 *     toCommonShape(raw):                 CommonRecord,       // normalize → shared shape
 *   }
 *
 * CommonRecord matches the fields consumed by dedupe.js/enrich.js/models/Concours.ts:
 *   { sourceId, source, source_url, organization_fr, organization_ar, title_fr, title_ar,
 *     deadline, date_concours, postes, niveau, specialites, datePosted, content_ar,
 *     organisme_website }
 *
 * runAdapter() drives one adapter respectfully: builds its politeFetch, walks the
 * listing, skips already-known sourceIds, fetches detail pages one at a time (the
 * politeFetch rate limit is enforced per host), and never lets one bad record abort
 * the whole run — mirrors the try/catch-per-id pattern already used in the legacy
 * alwadifa scraper.
 */

import { createPoliteFetcher } from './robots.js';
import { log } from '../logger.js';

export async function runAdapter(adapter, existingSourceIds, { maxNew = 15 } = {}) {
  const politeFetch = createPoliteFetcher(adapter.baseUrl);
  const results = [];
  let failed = 0;

  let listingIds;
  try {
    listingIds = await adapter.fetchListingIds(politeFetch, { maxNew });
  } catch (err) {
    log(`Concours[${adapter.name}]: ERREUR listing — ${err.message}`);
    return { added: results, failed: 0 };
  }

  // existingSourceIds always holds strings (Mongo stores sourceId as String) —
  // normalize both sides so numeric ids (e.g. alwadifa) still match correctly.
  const newIds = listingIds.filter((id) => !existingSourceIds.has(String(id))).slice(0, maxNew);
  log(`Concours[${adapter.name}]: ${listingIds.length} trouvé(s), ${newIds.length} nouveau(x) à traiter`);

  for (const id of newIds) {
    try {
      const raw = await adapter.fetchDetail(id, politeFetch);
      const common = adapter.toCommonShape(raw);
      if (!common.title_fr && !common.title_ar) {
        failed++;
        continue;
      }
      results.push(common);
    } catch (err) {
      log(`Concours[${adapter.name}]: ⚠ id ${id} ignoré — ${err.message}`);
      failed++;
    }
  }

  return { added: results, failed };
}
