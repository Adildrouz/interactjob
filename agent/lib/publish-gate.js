/**
 * Article-first publishing gate (Phase 2 + Phase 5).
 *
 * Lives underneath the low-level LinkedIn publish calls so that ANY post —
 * present or future, whatever generated its text — is scanned for blog
 * article links and blocked if one of them isn't actually live. This is the
 * structural guarantee: a post can't reach LinkedIn with a dead article link
 * because the publish function itself refuses to send it.
 *
 * Fails safe: on any unexpected error while checking, the link is treated as
 * NOT verified and the publish is blocked rather than risking a dead link.
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyArticleLive } from './verify-article-live.js';
import { log } from '../logger.js';
import { sendEmail } from '../mailer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOCKED_PATH = path.join(__dirname, '../../data/blocked-posts.json');
const SITE_URL = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const BLOG_URL_PATTERN = `${escapeRegExp(SITE_URL)}/blog/([a-z0-9-]+)`;

export function extractArticleUrls(text) {
  const urls = new Set();
  const re = new RegExp(BLOG_URL_PATTERN, 'gi');
  let m;
  while ((m = re.exec(text || ''))) urls.add(m[0].replace(/[).,;!?]+$/, ''));
  return [...urls];
}

async function recordBlocked(entry) {
  let blocked = [];
  try { blocked = await fs.readJson(BLOCKED_PATH); } catch { blocked = []; }
  blocked.push(entry);
  try { await fs.writeJson(BLOCKED_PATH, blocked, { spaces: 2 }); }
  catch (err) { log(`Gate: écriture blocked-posts.json échouée — ${err.message}`); }
}

async function alertBlock({ url, reason, status, label, text }) {
  try {
    await sendEmail({
      to: 'contact@interactjob.ma',
      subject: `🔴 Publication LinkedIn bloquée — lien article mort`,
      text:
        `Un post LinkedIn a été automatiquement BLOQUÉ car il référence un article qui n'est pas en ligne.\n\n` +
        `URL testée : ${url}\n` +
        `Raison     : ${reason} (HTTP ${status})\n` +
        `Label      : ${label || 'n/a'}\n\n` +
        `Début du texte du post :\n${(text || '').slice(0, 500)}\n\n` +
        `---\nRien n'a été publié. Vérifiez/déployez l'article puis relancez la publication manuellement.`,
    });
  } catch (err) {
    log(`Gate: envoi email alerte échoué — ${err.message}`);
  }
}

/**
 * Scans `text` for interactjob.ma/blog/<slug> links and verifies each is
 * live. Returns { ok: true } to allow publishing, or { ok: false, reason,
 * url, status } to block it. As a side effect, blocked attempts are logged,
 * persisted to data/blocked-posts.json, and alerted by email — the pipeline
 * never fails silently (Phase 5).
 */
export async function gateArticleLinks(text, meta = {}) {
  let urls;
  try {
    urls = extractArticleUrls(text);
  } catch (err) {
    return { ok: false, reason: `gate_error: ${err.message}` };
  }

  if (urls.length === 0) return { ok: true, urls: [] };

  for (const url of urls) {
    let check;
    try {
      check = await verifyArticleLive(url, { expectedPathIncludes: '/blog/' });
    } catch (err) {
      check = { ok: false, status: 0, reason: `verify_threw: ${err.message}` };
    }

    if (!check.ok) {
      log(`🔴 PUBLICATION BLOQUÉE [${meta.label || 'sans label'}] — ${url} — ${check.reason} (HTTP ${check.status})`);
      await recordBlocked({
        blockedAt: new Date().toISOString(),
        url,
        reason: check.reason,
        status: check.status,
        label: meta.label || null,
        textExcerpt: (text || '').slice(0, 300),
      });
      await alertBlock({ url, reason: check.reason, status: check.status, label: meta.label, text });
      return { ok: false, reason: check.reason, url, status: check.status };
    }
  }

  return { ok: true, urls };
}
