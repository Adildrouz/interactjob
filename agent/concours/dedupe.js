/**
 * Deduplication for the concours pipeline.
 *
 * A concours can appear on more than one source (e.g. emploi-public.ma and
 * alwadifa-maroc.com both list the same ministry recruitment). Match key is
 * organisme + titre + date de clôture, normalized. On a match we keep one
 * canonical document, union all known source URLs, and prefer the OFFICIAL
 * source URL over any aggregator's.
 */

// Higher wins when two sources disagree on which source_url to keep canonical.
// Any future ministry/institution adapter is "official" too — register it here.
const SOURCE_PRIORITY = {
  'emploi-public.ma': 2,
  'alwadifa-maroc.com': 1,
};

function priorityOf(source) {
  return SOURCE_PRIORITY[source] ?? 1;
}

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchKey(record) {
  const organisme = normalize(record.organization_fr || record.organization_ar);
  const titre = normalize(record.title_fr || record.title_ar);
  const deadline = record.deadline || '';
  if (!organisme || !titre) return null; // not enough signal to match reliably
  return `${organisme}|${titre}|${deadline}`;
}

/** Merge two common-shape records describing the same concours into one. */
function mergeRecords(a, b) {
  const [official, other] = priorityOf(a.source) >= priorityOf(b.source) ? [a, b] : [b, a];
  return {
    ...other,
    ...Object.fromEntries(Object.entries(official).filter(([, v]) => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))),
    source: official.source,
    source_url: official.source_url,
    source_urls: Array.from(new Set([...(a.source_urls || [a.source_url]), ...(b.source_urls || [b.source_url])])),
    // Keep whichever side has Arabic content, since the official side usually won't
    title_ar: official.title_ar || other.title_ar || null,
    organization_ar: official.organization_ar || other.organization_ar || null,
    content_ar: official.content_ar || other.content_ar || '',
  };
}

/** Collapse duplicates found within the same scrape run (across adapters). */
export function collapseBatch(records) {
  const byKey = new Map();
  const noKey = [];

  for (const rec of records) {
    const key = matchKey(rec);
    if (!key) { noKey.push(rec); continue; }
    const existing = byKey.get(key);
    byKey.set(key, existing ? mergeRecords(existing, rec) : { ...rec, source_urls: rec.source_urls || [rec.source_url] });
  }

  return [...byKey.values(), ...noKey];
}

/**
 * Splits a collapsed batch into { toInsert, toUpdate } against existing Mongo
 * documents. existingDocs must include organization_fr/organization_ar,
 * title_fr/title_ar, deadline, source, source_url, source_urls, _id.
 */
export function matchAgainstExisting(records, existingDocs) {
  const existingByKey = new Map();
  for (const doc of existingDocs) {
    const key = matchKey(doc);
    if (key) existingByKey.set(key, doc);
  }

  const toInsert = [];
  const toUpdate = [];

  for (const rec of records) {
    const key = matchKey(rec);
    const existing = key ? existingByKey.get(key) : null;

    if (!existing) {
      toInsert.push(rec);
      continue;
    }

    const merged = mergeRecords(existing, rec);
    toUpdate.push({
      _id: existing._id,
      source: merged.source,
      source_url: merged.source_url,
      source_urls: merged.source_urls,
      title_ar: merged.title_ar,
      organization_ar: merged.organization_ar,
      content_ar: merged.content_ar,
    });
  }

  return { toInsert, toUpdate };
}
