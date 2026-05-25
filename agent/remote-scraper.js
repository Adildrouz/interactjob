/**
 * InteractJob — Remote Jobs Scraper
 * Fetches 17 RSS feeds, filters last 48h, deduplicates by URL hash,
 * keeps 7 days of history, saves to data/remote-jobs.json, and git-pushes
 * so Vercel rebuilds only when new jobs are found.
 */

import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { execSync } from 'child_process';
import RSSParser from 'rss-parser';
import fs from 'fs-extra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.join(__dirname, '.env'), override: false });

const DATA_PATH  = path.join(__dirname, '../data/remote-jobs.json');
const REPO_ROOT  = path.join(__dirname, '..');
const KEEP_DAYS  = 7;
const HOURS_48   = 48 * 60 * 60 * 1000;

const FEEDS = [
  { url: 'https://weworkremotely.com/remote-jobs.rss',                                source: 'WeWorkRemotely', category: 'General'          },
  { url: 'https://remotive.com/feed',                                                  source: 'Remotive',       category: 'General'          },
  { url: 'https://himalayas.app/jobs/rss',                                             source: 'Himalayas',      category: 'General'          },
  { url: 'https://remoteok.com/remote-jobs.rss',                                      source: 'RemoteOK',       category: 'General'          },
  { url: 'https://www.workingnomads.com/feed',                                         source: 'WorkingNomads',  category: 'General'          },
  { url: 'https://remote.co/remote-jobs/feed/',                                       source: 'Remote.co',      category: 'General'          },
  { url: 'https://jobspresso.co/feed/',                                                source: 'Jobspresso',     category: 'General'          },
  { url: 'https://weworkremotely.com/categories/remote-sales-and-marketing-jobs.rss', source: 'WeWorkRemotely', category: 'Marketing'        },
  { url: 'https://weworkremotely.com/categories/remote-customer-support-jobs.rss',    source: 'WeWorkRemotely', category: 'Customer Support' },
  { url: 'https://weworkremotely.com/categories/remote-product-jobs.rss',             source: 'WeWorkRemotely', category: 'Product'          },
  { url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',         source: 'WeWorkRemotely', category: 'Development'      },
  { url: 'https://weworkremotely.com/categories/remote-design-jobs.rss',             source: 'WeWorkRemotely', category: 'Design'           },
  { url: 'https://remotive.com/remote-jobs/hr/feed',                                  source: 'Remotive',       category: 'HR'               },
  { url: 'https://remotive.com/remote-jobs/marketing/feed',                           source: 'Remotive',       category: 'Marketing'        },
  { url: 'https://remotive.com/remote-jobs/software-dev/feed',                       source: 'Remotive',       category: 'Development'      },
  { url: 'https://remotive.com/remote-jobs/design/feed',                             source: 'Remotive',       category: 'Design'           },
  { url: 'https://remotive.com/remote-jobs/finance/feed',                            source: 'Remotive',       category: 'Finance'          },
];

function makeId(link) {
  return crypto.createHash('md5').update(link).digest('hex').slice(0, 16);
}

function toSlug(title, linkHash) {
  // Generate clean slug from title + remote, with hash suffix for uniqueness
  const baseSlug = `${title}-remote`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 70);

  // Add hash suffix to ensure uniqueness (prevents collisions from same title)
  return `${baseSlug}-${linkHash.slice(0, 6)}`;
}

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function extractCompany(item) {
  if (item.author) return item.author.trim();
  if (item['dc:creator']) return item['dc:creator'].trim();
  // "Job Title at Company Name"
  const atMatch = (item.title || '').match(/ at ([^|]+)$/i);
  if (atMatch) return atMatch[1].trim();
  // "Company — Job Title" or "Company: Job Title"
  const dashMatch = (item.title || '').match(/^([^—:]+)[—:]/);
  if (dashMatch) return dashMatch[1].trim();
  return 'N/A';
}

function cleanTitle(raw) {
  return (raw || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .trim();
}

async function fetchFeed({ url, source, category }) {
  const parser = new RSSParser({
    timeout: 12000,
    headers: { 'User-Agent': 'InteractJob-RemoteBot/1.0 (+https://interactjob.ma)' },
  });
  try {
    const feed  = await parser.parseURL(url);
    const cutoff = Date.now() - HOURS_48;
    const jobs  = [];

    for (const item of feed.items || []) {
      const published = item.pubDate || item.isoDate || null;
      const pubMs     = published ? new Date(published).getTime() : 0;
      if (pubMs < cutoff) continue;

      const link = item.link || item.guid || '';
      if (!link) continue;

      const summary = stripHtml(
        item.contentSnippet || item.content || item.summary || item.description || ''
      ).slice(0, 300);

      const hashId = makeId(link);
      const title = cleanTitle(item.title);
      const slug = toSlug(title, hashId);

      jobs.push({
        id:        slug,  // Use clean slug instead of hash
        title,
        company:   extractCompany(item),
        link,
        published: published ? new Date(published).toISOString() : new Date().toISOString(),
        summary,
        source,
        category,
        scrapedAt: new Date().toISOString(),
      });
    }

    console.log(`[remote-scraper] ${source} / ${category}: ${jobs.length} jobs (48h)`);
    return jobs;
  } catch (err) {
    console.error(`[remote-scraper] ERREUR ${source} (${url}): ${err.message}`);
    return [];
  }
}

async function main() {
  console.log('[remote-scraper] Démarrage...');
  await fs.ensureDir(path.dirname(DATA_PATH));

  // Load & prune old jobs (keep KEEP_DAYS days)
  let existing = [];
  try { existing = await fs.readJson(DATA_PATH); } catch { /* first run */ }
  const keepCutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  existing = existing.filter(j => new Date(j.published).getTime() > keepCutoff);

  // Map existing links for deduplication (by link hash, not ID)
  const existingLinks = new Set(existing.map(j => makeId(j.link)));

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(FEEDS.map(f => fetchFeed(f)));
  const fetched  = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

  // Deduplicate by link hash (not by ID, since IDs are now slugs)
  const newJobs = fetched.filter(j => !existingLinks.has(makeId(j.link)));

  const finalJobs = [...newJobs, ...existing].sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()
  );

  await fs.writeJson(DATA_PATH, finalJobs, { spaces: 2 });
  console.log(`[remote-scraper] ${newJobs.length} nouveaux jobs. Total: ${finalJobs.length} jobs.`);

  // Git push only when new jobs were found (avoids unnecessary Vercel deploys)
  if (newJobs.length === 0) {
    console.log('[remote-scraper] Aucun nouveau job — git push ignoré.');
    return;
  }

  try {
    execSync('git add data/remote-jobs.json', { cwd: REPO_ROOT, stdio: 'pipe' });
    execSync(
      'git diff --cached --quiet || git commit -m "chore: remote jobs update [skip ci]"',
      { cwd: REPO_ROOT, stdio: 'pipe', shell: true }
    );
    execSync('git push origin main', { cwd: REPO_ROOT, stdio: 'pipe' });
    console.log('[remote-scraper] Git push ✓');
  } catch (gitErr) {
    console.error(`[remote-scraper] Git push ignoré — ${gitErr.message?.split('\n')[0]}`);
  }
}

main().catch(err => {
  console.error('[remote-scraper] FATAL:', err);
  process.exit(1);
});
