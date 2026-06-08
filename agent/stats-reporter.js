/**
 * Daily Stats Reporter — sends a Telegram digest every morning.
 *
 * Data sources (each optional — skipped if env vars absent):
 *   MongoDB       → business metrics (always)
 *   Site ping     → uptime + response time (always)
 *   GA4           → traffic  (needs GA4_PROPERTY_ID + GOOGLE_SERVICE_ACCOUNT_KEY)
 *   Search Console→ SEO      (needs GSC_SITE_URL + same service account)
 *   Claude AI     → citation check (needs ANTHROPIC_API_KEY, already present)
 *
 * Setup for GA4 / GSC:
 *   1. Google Cloud Console → IAM → Service Accounts → Create
 *   2. Enable "Google Analytics Data API" and "Search Console API"
 *   3. GA4 property → Admin → Property Access → add service account (Viewer)
 *   4. Search Console → Settings → Users → add service account (Restricted)
 *   5. Download JSON key → minify to one line → set as GOOGLE_SERVICE_ACCOUNT_KEY
 *   6. Set GA4_PROPERTY_ID=properties/XXXXXXXXX  (from GA4 Admin > Property details)
 *   7. Set GSC_SITE_URL=https://www.interactjob.ma/
 */

import { MongoClient } from 'mongodb';
import { google } from 'googleapis';
import Anthropic from '@anthropic-ai/sdk';
import { log } from './logger.js';

const SITE_URL   = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const DB_NAME    = 'interactjob';

// Revenue constants
const DEC_TARGETS    = { cv: 20000, personality: 12000, annonces: 9900, services: 6830 };
const MONTHLY_SCALE  = { 6: 0.12, 7: 0.22, 8: 0.35, 9: 0.50, 10: 0.65, 11: 0.82, 12: 1.0 };
const CV_PRICE       = 29;
const PERSONALITY_PRICE = 49;
const ANNONCE_PRICE  = 990;

// ── Telegram ───────────────────────────────────────────────────────────────────
async function sendTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) { log('[stats] Telegram not configured'); return; }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch (err) {
    log(`[stats] Telegram error: ${err.message}`);
  }
}

// ── Site health ────────────────────────────────────────────────────────────────
async function checkSiteHealth() {
  const start = Date.now();
  try {
    const res = await fetch(SITE_URL, { signal: AbortSignal.timeout(12000) });
    return { ok: res.status < 400, status: res.status, ms: Date.now() - start };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - start, error: err.message };
  }
}

// ── Google Auth (OAuth2 preferred, service account as fallback) ───────────────
function buildGoogleAuth() {
  // OAuth2 refresh token (preferred — works with personal Google account)
  const clientId      = process.env.GOOGLE_CLIENT_ID;
  const clientSecret  = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken  = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    try {
      const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
      oauth2.setCredentials({ refresh_token: refreshToken });
      return oauth2;
    } catch (err) {
      log(`[stats] OAuth2 auth error: ${err.message}`);
    }
  }

  // Service account key (fallback)
  const keyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (keyStr) {
    try {
      return new google.auth.GoogleAuth({
        credentials: JSON.parse(keyStr),
        scopes: [
          'https://www.googleapis.com/auth/analytics.readonly',
          'https://www.googleapis.com/auth/webmasters.readonly',
        ],
      });
    } catch (err) {
      log(`[stats] Service account auth error: ${err.message}`);
    }
  }

  return null;
}

// ── Google Analytics 4 ────────────────────────────────────────────────────────
async function getGA4Stats(gauth, yesterday) {
  const propertyId = process.env.GA4_PROPERTY_ID; // e.g. "properties/123456789"
  if (!gauth || !propertyId) return null;

  try {
    const analyticsdata = google.analyticsdata({ version: 'v1beta', auth: gauth });

    const [overview, topPages] = await Promise.all([
      analyticsdata.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [
            { startDate: yesterday, endDate: yesterday, name: 'yesterday' },
            { startDate: 'NdaysAgo'.replace('N', '8'), endDate: 'NdaysAgo'.replace('N', '2'), name: 'prev' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'newUsers' },
          ],
        },
      }),
      analyticsdata.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate: yesterday, endDate: yesterday }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          limit: 5,
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        },
      }),
    ]);

    const row = (dateRange) =>
      overview.data.rows?.find(r => r.dimensionValues?.[0]?.value === dateRange)?.metricValues;

    const yest = row('yesterday') || [];
    const prev = row('prev') || [];

    const sessions     = parseInt(yest[0]?.value || '0');
    const prevSessions = parseInt(prev[0]?.value || '0') / 7; // daily avg of the 7-day window

    const pages = topPages.data.rows?.slice(0, 5).map(r => ({
      path:  r.dimensionValues[0].value,
      views: parseInt(r.metricValues[0].value),
    })) || [];

    return {
      sessions,
      users:      parseInt(yest[1]?.value || '0'),
      pageviews:  parseInt(yest[2]?.value || '0'),
      bounceRate: parseFloat(yest[3]?.value || '0') * 100,
      avgDuration:parseFloat(yest[4]?.value || '0'),
      newUsers:   parseInt(yest[5]?.value || '0'),
      sessionsDelta: sessions - Math.round(prevSessions),
      topPages:   pages,
    };
  } catch (err) {
    log(`[stats] GA4 error: ${err.message}`);
    return null;
  }
}

// ── Google Search Console ──────────────────────────────────────────────────────
async function getGSCStats(gauth, yesterday) {
  const siteUrl = process.env.GSC_SITE_URL; // e.g. "https://www.interactjob.ma/"
  if (!gauth || !siteUrl) return null;

  try {
    const sc = google.searchconsole({ version: 'v1', auth: gauth });

    const [totals, keywords] = await Promise.all([
      sc.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: yesterday,
          endDate: yesterday,
          dimensions: [],
          rowLimit: 1,
        },
      }),
      sc.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: yesterday,
          endDate: yesterday,
          dimensions: ['query'],
          rowLimit: 5,
          orderby: [{ field: 'clicks', sortOrder: 'DESCENDING' }],
        },
      }),
    ]);

    const row = totals.data.rows?.[0] || {};
    return {
      clicks:     Math.round(row.clicks || 0),
      impressions:Math.round(row.impressions || 0),
      ctr:        ((row.ctr || 0) * 100).toFixed(1),
      position:   (row.position || 0).toFixed(1),
      topKeywords: keywords.data.rows?.map(r => ({
        keyword: r.keys[0],
        clicks:  r.clicks,
        pos:     r.position?.toFixed(1),
      })) || [],
    };
  } catch (err) {
    log(`[stats] GSC error: ${err.message}`);
    return null;
  }
}

// ── AI citation check ─────────────────────────────────────────────────────────
async function checkAICitation() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const queries = [
    'Quelles sont les meilleures plateformes de recrutement et d\'emploi au Maroc en 2026 ?',
    'Où trouver des offres d\'emploi au Maroc ?',
  ];

  try {
    const claude = new Anthropic({ apiKey });
    const results = await Promise.all(
      queries.map(q =>
        claude.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{ role: 'user', content: q }],
        }).then(r => r.content[0].text)
      )
    );

    const combined = results.join(' ').toLowerCase();
    const mentioned = combined.includes('interactjob');

    let snippet = null;
    if (mentioned) {
      const idx = combined.indexOf('interactjob');
      snippet = combined.substring(Math.max(0, idx - 20), idx + 60).trim();
    }

    return { mentioned, snippet, queriesChecked: queries.length };
  } catch (err) {
    log(`[stats] AI citation error: ${err.message}`);
    return null;
  }
}

// ── MongoDB business metrics ───────────────────────────────────────────────────
async function getMongoStats(todayStart, todayEnd, monthStart, monthEnd, yesterdayStart) {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  try {
    // candidates → submittedAt | cvcheckusages → checkedAt (all = paid)
    // personality_assessments → createdAt, isPremium:true | jobpayments → createdAt
    const [
      totalCandidates, newToday, newYesterday,
      cvToday, cvMonth,
      persToday, persMonth,
      annToday, annMonth,
      liLinked, liPending,
    ] = await Promise.all([
      db.collection('candidates').countDocuments(),
      db.collection('candidates').countDocuments({ submittedAt: { $gte: todayStart.toISOString(), $lt: todayEnd.toISOString() } }),
      db.collection('candidates').countDocuments({ submittedAt: { $gte: yesterdayStart.toISOString(), $lt: todayStart.toISOString() } }),
      db.collection('cvcheckusages').countDocuments({ checkedAt: { $gte: todayStart.toISOString(), $lt: todayEnd.toISOString() } }),
      db.collection('cvcheckusages').countDocuments({ checkedAt: { $gte: monthStart.toISOString(), $lt: monthEnd.toISOString() } }),
      db.collection('personality_assessments').countDocuments({ isPremium: true, createdAt: { $gte: todayStart, $lt: todayEnd } }),
      db.collection('personality_assessments').countDocuments({ isPremium: true, createdAt: { $gte: monthStart, $lt: monthEnd } }),
      db.collection('jobpayments').countDocuments({ createdAt: { $gte: todayStart, $lt: todayEnd } }),
      db.collection('jobpayments').countDocuments({ createdAt: { $gte: monthStart, $lt: monthEnd } }),
      db.collection('linkedin_messages').countDocuments({ processed_at: { $gte: todayStart.toISOString(), $lt: todayEnd.toISOString() } }),
      db.collection('linkedin_messages').countDocuments({ status: 'pending' }),
    ]);

    const revenueToday = cvToday * CV_PRICE + persToday * PERSONALITY_PRICE + annToday * ANNONCE_PRICE;
    const revenueMonth = cvMonth * CV_PRICE + persMonth * PERSONALITY_PRICE + annMonth * ANNONCE_PRICE;

    return {
      candidates: { total: totalCandidates, today: newToday, yesterday: newYesterday },
      services:   { cv: { today: cvToday, month: cvMonth }, pers: { today: persToday, month: persMonth }, ann: { today: annToday, month: annMonth } },
      revenue:    { today: revenueToday, month: revenueMonth },
      linkedin:   { processed: liLinked, pending: liPending },
    };
  } finally {
    await client.close();
  }
}

// ── Formatting helpers ─────────────────────────────────────────────────────────
function bar(value, max, width = 8) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const f = Math.round(pct * width);
  return '▓'.repeat(f) + '░'.repeat(width - f) + ` ${Math.round(pct * 100)}%`;
}

function delta(n, ref) {
  if (ref == null) return '';
  const d = n - ref;
  if (d > 0) return ` (+${d})`;
  if (d < 0) return ` (${d})`;
  return ' (=)';
}

function dur(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m${s}s` : `${s}s`;
}

// ── Main export ────────────────────────────────────────────────────────────────
export async function runStatsReporter() {
  log('[stats-reporter] Démarrage du rapport quotidien...');

  const now  = new Date();
  const month = now.getMonth() + 1;

  // Date boundaries (Casablanca = GMT+1)
  const offset = 60 * 60 * 1000; // +1h
  const todayMidnight = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - offset);
  const todayStart    = todayMidnight;
  const todayEnd      = new Date(todayStart.getTime() + 86400000);
  const monthStart    = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1) - offset);
  const monthEnd      = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1) - offset);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const yesterdayStr  = new Date(todayStart.getTime() - 86400000)
    .toISOString().slice(0, 10); // "YYYY-MM-DD"

  const dateLabel = now.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Africa/Casablanca',
  });

  // Collect all data in parallel
  const gauth = buildGoogleAuth();
  const [mongo, health, ga4, gsc, ai] = await Promise.all([
    getMongoStats(todayStart, todayEnd, monthStart, monthEnd, yesterdayStart)
      .catch(err => { log(`[stats] MongoDB: ${err.message}`); return null; }),
    checkSiteHealth(),
    getGA4Stats(gauth, yesterdayStr),
    getGSCStats(gauth, yesterdayStr),
    checkAICitation(),
  ]);

  const scale      = MONTHLY_SCALE[month] || 0.12;
  const targetMonth = Math.round(
    (DEC_TARGETS.cv + DEC_TARGETS.personality + DEC_TARGETS.annonces + DEC_TARGETS.services) * scale
  );

  // ── Build Telegram message ─────────────────────────────────────────────────
  const L = '\n'; // newline alias
  let msg = '';

  msg += `📊 <b>Rapport InteractJob</b> — ${dateLabel}${L}`;
  msg += `${'─'.repeat(32)}${L}${L}`;

  // Site health
  msg += `⚡ <b>SANTÉ DU SITE</b>${L}`;
  msg += `${health.ok ? '✅' : '🔴'} interactjob.ma — `;
  msg += health.ok ? `${health.ms}ms` : `HORS LIGNE (${health.error || health.status})`;
  msg += `${L}${L}`;

  // GA4 traffic
  msg += `🌐 <b>TRAFIC</b> (hier)${L}`;
  if (ga4) {
    msg += `├ Sessions : <b>${ga4.sessions}</b>${delta(ga4.sessions, ga4.sessions - ga4.sessionsDelta)}${L}`;
    msg += `├ Utilisateurs : <b>${ga4.users}</b> (${ga4.newUsers} nouveaux)${L}`;
    msg += `├ Pages vues : <b>${ga4.pageviews}</b>${L}`;
    msg += `├ Taux de rebond : <b>${ga4.bounceRate.toFixed(0)}%</b>${L}`;
    msg += `└ Durée moy. session : <b>${dur(ga4.avgDuration)}</b>${L}`;
    if (ga4.topPages.length > 0) {
      msg += `📄 Top pages : ${ga4.topPages.map(p => `<code>${p.path}</code> (${p.views})`).join(', ')}${L}`;
    }
  } else {
    msg += `└ — Non configuré (ajouter GA4_PROPERTY_ID + GOOGLE_SERVICE_ACCOUNT_KEY)${L}`;
  }
  msg += L;

  // MongoDB business activity
  if (mongo) {
    msg += `👥 <b>ACTIVITÉ PLATEFORME</b>${L}`;
    msg += `├ Candidats total : <b>${mongo.candidates.total}</b>${L}`;
    msg += `├ Nouveaux aujourd'hui : <b>+${mongo.candidates.today}</b>`;
    if (mongo.candidates.yesterday > 0)
      msg += ` (hier : +${mongo.candidates.yesterday})`;
    msg += L;
    msg += `├ CVs générés : ${mongo.services.cv.today} auj. / ${mongo.services.cv.month} ce mois${L}`;
    msg += `├ Tests perso : ${mongo.services.pers.today} auj. / ${mongo.services.pers.month} ce mois${L}`;
    msg += `└ Annonces sponsorisées : ${mongo.services.ann.today} auj. / ${mongo.services.ann.month} ce mois${L}`;
    msg += L;

    msg += `💰 <b>REVENUS (${now.toLocaleString('fr-FR', { month: 'long', timeZone: 'Africa/Casablanca' })})</b>${L}`;
    msg += `├ Aujourd'hui : <b>${mongo.revenue.today} MAD</b>${L}`;
    msg += `├ Ce mois : <b>${mongo.revenue.month} MAD</b> / objectif ${targetMonth} MAD${L}`;
    msg += `└ ${bar(mongo.revenue.month, targetMonth)}${L}`;
    msg += L;

    msg += `💬 <b>MESSAGES LINKEDIN</b>${L}`;
    msg += `├ Traités aujourd'hui : ${mongo.linkedin.processed}${L}`;
    msg += `└ En attente : ${mongo.linkedin.pending}${L}`;
    msg += L;
  }

  // SEO - Search Console
  msg += `🔍 <b>SEO</b> (hier, Search Console)${L}`;
  if (gsc) {
    msg += `├ Clics : <b>${gsc.clicks}</b>${L}`;
    msg += `├ Impressions : <b>${gsc.impressions}</b>${L}`;
    msg += `├ CTR : <b>${gsc.ctr}%</b>${L}`;
    msg += `├ Position moy. : <b>${gsc.position}</b>${L}`;
    if (gsc.topKeywords.length > 0) {
      msg += `└ Top mots-clés :${L}`;
      gsc.topKeywords.forEach((kw, i) => {
        const prefix = i === gsc.topKeywords.length - 1 ? '   └' : '   ├';
        msg += `${prefix} "${kw.keyword}" — ${kw.clicks} clics (pos. ${kw.pos})${L}`;
      });
    } else {
      msg += `└ Pas de données keywords${L}`;
    }
  } else {
    msg += `└ — Non configuré (ajouter GSC_SITE_URL + GOOGLE_SERVICE_ACCOUNT_KEY)${L}`;
  }
  msg += L;

  // AI citations
  msg += `🤖 <b>CITATIONS IA</b> (Claude)${L}`;
  if (ai === null) {
    msg += `└ — Erreur de vérification${L}`;
  } else if (ai.mentioned) {
    msg += `└ ✅ <b>Mentionné !</b>`;
    if (ai.snippet) msg += ` "…${ai.snippet}…"`;
    msg += L;
  } else {
    msg += `└ ❌ Non mentionné (${ai.queriesChecked} requêtes testées)${L}`;
  }

  msg += L;
  msg += `─`.repeat(32) + L;
  msg += `🔗 <a href="${SITE_URL}/admin">Ouvrir le dashboard</a>`;

  // Split if > 4096 chars (Telegram limit)
  if (msg.length > 4000) {
    await sendTelegram(msg.slice(0, 4000) + '\n…(suite tronquée)');
  } else {
    await sendTelegram(msg);
  }

  log('[stats-reporter] ✓ Rapport envoyé');
}

// Direct run
if (process.argv[1]?.endsWith('stats-reporter.js')) {
  import('dotenv/config').then(() => {
    runStatsReporter().catch(err => { console.error(err); process.exit(1); });
  });
}
