/**
 * Concours adapter — alwadifa-maroc.com (secondary/legacy source).
 * Arabic-primary — title_fr/organization_fr are left null here; the shared
 * enrich.js step (Claude Haiku) fills them in via translation, same as the
 * pre-refactor concours-parser.js used to do inline.
 */

const BASE_URL = 'https://alwadifa-maroc.com';

async function fetchListingIds(politeFetch) {
  const $ = await politeFetch(BASE_URL);
  const ids = new Set();
  $('a[href*="/offre/show/id/"]').each((_, el) => {
    const m = $(el).attr('href').match(/\/offre\/show\/id\/(\d+)/);
    if (m) ids.add(parseInt(m[1], 10));
  });
  return [...ids].sort((a, b) => b - a); // newest first
}

async function fetchDetail(id, politeFetch) {
  const url = `${BASE_URL}/offre/show/id/${id}`;
  const $ = await politeFetch(url);

  let datePosted = '';
  let organization_ar = '';
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      if (data.datePosted) datePosted = data.datePosted;
      if (data.hiringOrganization?.name) organization_ar = data.hiringOrganization.name;
    } catch {
      // Not every script tag is valid JSON-LD — ignore and keep scanning
    }
  });

  const title_ar = $('h1').first().text().trim().replace(/\s+/g, ' ');
  const contentHtml = $('.job-content').html() || $('.main-content-container').html() || '';
  const content_ar = $('<div>').html(contentHtml).text().replace(/\s+/g, ' ').trim().slice(0, 3000);

  return { sourceId: id, sourceUrl: url, title_ar, organization_ar, datePosted, content_ar };
}

function toCommonShape(raw) {
  return {
    sourceId: raw.sourceId,
    source: 'alwadifa-maroc.com',
    source_url: raw.sourceUrl,
    organization_fr: null,
    organization_ar: raw.organization_ar || null,
    title_fr: null,
    title_ar: raw.title_ar || null,
    deadline: null,
    date_concours: null,
    postes: null,
    niveau: null,
    specialites: [],
    datePosted: raw.datePosted || null,
    content_ar: raw.content_ar || '',
    organisme_website: null,
  };
}

export const alwadifaAdapter = {
  name: 'alwadifa-maroc.com',
  baseUrl: BASE_URL,
  fetchListingIds,
  fetchDetail,
  toCommonShape,
};
