/**
 * Concours adapter — emploi-public.ma (official Moroccan public-sector portal)
 * Source is native French — no AI translation needed, only extraction +
 * (separately, in enrich.js) unique analysis/FAQ generation.
 *
 * robots.txt only disallows /fr/concours/download/* (PDF attachments) — never
 * fetched here, only the listing/detail HTML pages.
 */

const BASE_URL     = 'https://www.emploi-public.ma';
const LISTING_URL  = `${BASE_URL}/fr/concours-liste`;
const DETAIL_URL   = (id) => `${BASE_URL}/fr/concours/details/${id}`;
const UUID_RE      = /\/fr\/concours\/details\/([0-9a-f-]{36})/i;

const FR_MONTHS = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};

function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function parseFrenchDate(text) {
  if (!text) return null;
  const m = text.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = FR_MONTHS[stripAccents(m[2].toLowerCase())];
  if (!month) return null;
  const year = parseInt(m[3], 10);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parsePostesCount(text) {
  if (!text) return null;
  const m = text.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

async function fetchListingIds(politeFetch, { maxPages = 3 } = {}) {
  const ids = [];
  const seen = new Set();

  for (let page = 1; page <= maxPages; page++) {
    const $ = await politeFetch(`${LISTING_URL}?page=${page}`);
    let foundOnPage = 0;

    $('a.card').each((_, el) => {
      const href = $(el).attr('href') || '';
      const m = href.match(UUID_RE);
      if (!m) return;
      const id = m[1];
      if (seen.has(id)) return;
      seen.add(id);
      ids.push(id);
      foundOnPage++;
    });

    if (foundOnPage === 0) break; // no more pages worth walking
  }

  return ids;
}

function textOfValue($, h3) {
  // <h3><span>Label</span>Value</h3> — value is the trailing text node
  return $(h3).clone().find('span').remove().end().text().replace(/\s+/g, ' ').trim();
}

async function fetchDetail(id, politeFetch) {
  const url = DETAIL_URL(id);
  const $ = await politeFetch(url);

  const title_fr = $('h1').first().clone().find('span').remove().end().text().replace(/\s+/g, ' ').trim();

  let organization_fr = $('.form-title h3 strong').first().text().replace(/\s+/g, ' ').trim();
  let organisme_website = $('.form-info a').first().attr('href') || null;

  let deadline = null;
  let date_concours = null;
  let datePosted = null;

  $('.s-content-box h3.h4').each((_, h3) => {
    const label = $(h3).find('span').text().toLowerCase();
    const value = textOfValue($, h3);
    if (label.includes('recrute') && !organization_fr) organization_fr = value;
    else if (label.includes('délai') || label.includes('delai') || label.includes('dépôt') || label.includes('depot')) {
      deadline = parseFrenchDate(value) || deadline;
    } else if (label.includes('date du concours')) {
      date_concours = parseFrenchDate(value);
    } else if (label.includes('publication')) {
      datePosted = parseFrenchDate(value);
    }
  });

  let postes = null;
  let niveau = null;
  const specialites = [];
  let grade = null;

  $('.s-content-box.full ul li').each((_, li) => {
    const label = $(li).find('span').text().toLowerCase();
    const value = $(li).find('strong').text().replace(/\s+/g, ' ').trim().replace(/^-\s*/, '');
    if (!value) return;
    if (label.includes('spécialit') || label.includes('specialit')) specialites.push(value);
    else if (label.includes('grade')) grade = value;
    else if (label.includes('nombre de post')) postes = parsePostesCount(value);
    else if (label.includes('niveau') || label.includes('diplôme') || label.includes('diplome')) niveau = value;
  });

  return {
    sourceId: id,
    sourceUrl: url,
    title_fr,
    organization_fr,
    organisme_website,
    deadline,
    date_concours,
    datePosted,
    postes,
    niveau,
    specialites,
    grade,
  };
}

function toCommonShape(raw) {
  return {
    sourceId: raw.sourceId,
    source: 'emploi-public.ma',
    source_url: raw.sourceUrl,
    organization_fr: raw.organization_fr || null,
    organization_ar: null,
    title_fr: raw.title_fr || null,
    title_ar: null,
    deadline: raw.deadline,
    date_concours: raw.date_concours,
    postes: raw.postes,
    niveau: raw.niveau || raw.grade || null,
    specialites: raw.specialites,
    datePosted: raw.datePosted,
    content_ar: '',
    organisme_website: raw.organisme_website,
  };
}

export const emploiPublicAdapter = {
  name: 'emploi-public.ma',
  baseUrl: BASE_URL,
  fetchListingIds,
  fetchDetail,
  toCommonShape,
};
