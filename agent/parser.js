import Parser from 'rss-parser';

const rssParser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; InteractJob-Agent/1.0; +https://interactjob.vercel.app)',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['dc:creator', 'creator'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

export const FEEDS = [
  { name: 'Emploi.ma',  siteName: 'Emploi.ma',   url: 'https://www.emploi.ma/rss.xml' },
  { name: 'Dreamjob',   siteName: 'Dreamjob.ma', url: 'https://www.dreamjob.ma/feed/' },
  // Rekrute.com â€” RSS supprimé (404 depuis mai 2026)
  // Bayt.com    â€” RSS bloqué (403 depuis mai 2026)
];

const MOROCCAN_CITIES = [
  'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Agadir', 'Tanger',
  'Meknès', 'Oujda', 'Tétouan', 'Khouribga', 'Essaouira', 'Safi',
  'El Jadida', 'Béni Mellal', 'Nador', 'Settat', 'Laâyoune',
];

function stripHtml(str) {
  if (!str) return '';
  return str
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, '')
    .replace(/\s{3,}/g, '\n\n')
    .trim();
}

function extractCompany(item) {
  // 1. Explicit RSS creator / author fields
  if (item.creator && item.creator.trim()) return item.creator.trim();

  // 2. Try to split title: "Job Title - Company - City" or "Job Title | Company"
  const title = item.title || '';
  const byPipe = title.split('|');
  if (byPipe.length >= 2) {
    const last = byPipe[byPipe.length - 1].trim();
    if (last.length > 2 && last.length < 60) return last;
  }
  const byDash = title.split(' - ');
  if (byDash.length >= 3) {
    const candidate = byDash[byDash.length - 2].trim();
    if (candidate.length > 2 && candidate.length < 60) return candidate;
  }
  if (byDash.length === 2) {
    const candidate = byDash[1].trim();
    if (candidate.length > 2 && candidate.length < 60) return candidate;
  }

  return 'Entreprise confidentielle';
}

function extractCity(item) {
  const haystack = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`;
  for (const city of MOROCCAN_CITIES) {
    if (haystack.includes(city)) return city;
  }
  // Try the last segment of a "Title - Company - City" pattern
  const byDash = (item.title || '').split(' - ');
  if (byDash.length >= 3) {
    const last = byDash[byDash.length - 1].trim();
    if (last.length > 2 && last.length < 40) return last;
  }
  return 'Maroc';
}

function extractTitle(item) {
  let title = stripHtml(item.title || 'Sans titre');
  // Remove trailing " | Company" or " - Company - City" suffix from title
  const byPipe = title.split(' | ');
  if (byPipe.length >= 2) title = byPipe[0].trim();
  const byDash = title.split(' - ');
  if (byDash.length >= 3) title = byDash[0].trim();
  return title || 'Sans titre';
}

function extractDate(item) {
  const raw = item.isoDate || item.pubDate;
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

function normalizeItem(item, feed) {
  const link = (item.link || item.guid || '').trim();
  if (!link) return null; // Skip items with no URL â€” can't deduplicate them

  const rawDescription = item.contentEncoded || item.content || item.contentSnippet || item.summary || '';

  return {
    title:       extractTitle(item),
    company:     extractCompany(item),
    location:    extractCity(item),
    description: stripHtml(rawDescription).slice(0, 2000),
    source_url:  link,
    source_site: feed.siteName,
    date_posted: extractDate(item),
  };
}

export async function fetchFeeds() {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const parsed = await rssParser.parseURL(feed.url);
      const items = (parsed.items || [])
        .map((item) => normalizeItem(item, feed))
        .filter(Boolean);
      return { feed, items };
    })
  );

  const allItems = [];
  const feedStats = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const feed = FEEDS[i];
    if (result.status === 'fulfilled') {
      allItems.push(...result.value.items);
      feedStats.push({ name: feed.name, siteName: feed.siteName, count: result.value.items.length, error: null });
    } else {
      feedStats.push({ name: feed.name, siteName: feed.siteName, count: 0, error: result.reason?.message || 'Erreur inconnue' });
    }
  }

  return { items: allItems, feedStats };
}
