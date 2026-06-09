/**
 * Stats Reporter — daily, weekly, monthly Telegram reports + PPTX business review.
 *
 * Crons (set in agent.js):
 *   Daily   08:00 Casablanca → runStatsReporter()
 *   Weekly  Monday 08:15     → runWeeklyReport()
 *   Monthly 1st 08:30        → runMonthlyReport() + runMonthlyReview()
 *
 * Env vars:
 *   Required : TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, MONGODB_URI, ANTHROPIC_API_KEY
 *   Optional : GA4_PROPERTY_ID, GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN, GSC_SITE_URL
 */

import { MongoClient } from 'mongodb';
import { google } from 'googleapis';
import Anthropic from '@anthropic-ai/sdk';
import { log } from './logger.js';
import { createWriteStream, unlinkSync, readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname_stats = path.dirname(fileURLToPath(import.meta.url));
const JOBS_PATH = path.join(__dirname_stats, '../data/jobs.json');

const SITE_URL  = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const DB_NAME   = 'interactjob';
const STATS_COL = 'daily_stats';

const DEC_TARGETS   = { cv: 20000, personality: 12000, annonces: 9900, services: 6830 };
const MONTHLY_SCALE = { 6: 0.12, 7: 0.22, 8: 0.35, 9: 0.50, 10: 0.65, 11: 0.82, 12: 1.0 };
const CV_PRICE = 29, PERSONALITY_PRICE = 49, ANNONCE_PRICE = 990;

// ── Helpers ────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Telegram ───────────────────────────────────────────────────────────────────
async function tgSend(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  try {
    const res  = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.ok) log(`[stats] Telegram API error: ${JSON.stringify(json.description || json)}`);
    return json;
  } catch (e) { log(`[stats] Telegram error: ${e.message}`); }
}

async function sendTelegram(text) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) { log('[stats] Telegram not configured'); return; }
  const chunks = [];
  for (let i = 0; i < text.length; i += 4000) chunks.push(text.slice(i, i + 4000));
  for (const chunk of chunks) {
    const result = await tgSend('sendMessage', { chat_id: chatId, text: chunk, parse_mode: 'HTML', disable_web_page_preview: true });
    // If HTML parsing failed, retry as plain text
    if (result && !result.ok) {
      log('[stats] HTML parse failed — retrying as plain text');
      const plain = chunk.replace(/<[^>]+>/g, '');
      await tgSend('sendMessage', { chat_id: chatId, text: plain, disable_web_page_preview: true });
    }
  }
}

async function sendTelegramDocument(filePath, caption) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  if (!chatId || !token) return;
  try {
    const { default: FormData } = await import('form-data');
    const { createReadStream } = await import('fs');
    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', caption || '');
    form.append('document', createReadStream(filePath));
    await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });
  } catch (e) { log(`[stats] sendDocument error: ${e.message}`); }
}

// ── Site health ────────────────────────────────────────────────────────────────
async function checkSiteHealth() {
  const start = Date.now();
  try {
    const res = await fetch(SITE_URL, { signal: AbortSignal.timeout(12000) });
    return { ok: res.status < 400, status: res.status, ms: Date.now() - start };
  } catch (e) { return { ok: false, ms: Date.now() - start, error: e.message }; }
}

// ── Google Auth ────────────────────────────────────────────────────────────────
function buildGoogleAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (clientId && clientSecret && refreshToken) {
    try {
      const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
      oauth2.setCredentials({ refresh_token: refreshToken });
      return oauth2;
    } catch (e) { log(`[stats] OAuth2 error: ${e.message}`); }
  }
  const keyStr = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (keyStr) {
    try {
      return new google.auth.GoogleAuth({
        credentials: JSON.parse(keyStr),
        scopes: ['https://www.googleapis.com/auth/analytics.readonly', 'https://www.googleapis.com/auth/webmasters.readonly'],
      });
    } catch (e) { log(`[stats] Service account error: ${e.message}`); }
  }
  return null;
}

// ── GA4 ────────────────────────────────────────────────────────────────────────
async function getGA4Stats(gauth, startDate, endDate) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!gauth || !propertyId) return null;
  try {
    const api = google.analyticsdata({ version: 'v1beta', auth: gauth });

    const [overview, channels, countries, topPages] = await Promise.all([
      api.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' },
            { name: 'bounceRate' }, { name: 'averageSessionDuration' }, { name: 'newUsers' },
          ],
        },
      }),
      api.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionSourceMedium' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 10,
        },
      }),
      api.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 6,
        },
      }),
      api.properties.runReport({
        property: propertyId,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 5,
        },
      }),
    ]);

    const mv = overview.data?.rows?.[0]?.metricValues || [];
    return {
      sessions:     parseInt(mv[0]?.value || '0'),
      users:        parseInt(mv[1]?.value || '0'),
      pageviews:    parseInt(mv[2]?.value || '0'),
      bounceRate:   (parseFloat(mv[3]?.value || '0') * 100).toFixed(1),
      avgDuration:  parseFloat(mv[4]?.value || '0'),
      newUsers:     parseInt(mv[5]?.value || '0'),
      channels: channels.data?.rows?.map(r => ({
        source: r.dimensionValues[0].value, sessions: parseInt(r.metricValues[0].value),
      })) || [],
      countries: countries.data?.rows?.map(r => ({
        name: r.dimensionValues[0].value, sessions: parseInt(r.metricValues[0].value),
      })) || [],
      topPages: topPages.data?.rows?.map(r => ({
        path: r.dimensionValues[0].value, views: parseInt(r.metricValues[0].value),
      })) || [],
    };
  } catch (e) { log(`[stats] GA4 error: ${e.message}`); return null; }
}

// ── GSC ────────────────────────────────────────────────────────────────────────
async function getGSCStats(gauth, startDate, endDate) {
  if (!gauth) return null;
  // Try domain property first (sc-domain:), then URL prefix
  const candidates = [];
  const raw = process.env.GSC_SITE_URL || '';
  if (raw) candidates.push(raw);
  // Auto-derive sc-domain: from a URL prefix property
  const urlMatch = raw.match(/https?:\/\/(?:www\.)?([^/]+)/);
  if (urlMatch) {
    const domain = urlMatch[1];
    if (!raw.startsWith('sc-domain:')) candidates.unshift(`sc-domain:${domain}`);
  }
  const sc = google.searchconsole({ version: 'v1', auth: gauth });
  for (const siteUrl of candidates) {
    try {
      const [totals, keywords] = await Promise.all([
        sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: [], rowLimit: 1 } }),
        sc.searchanalytics.query({ siteUrl, requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 5, orderby: [{ field: 'clicks', sortOrder: 'DESCENDING' }] } }),
      ]);
      const row = totals.data.rows?.[0] || {};
      return {
        clicks:      Math.round(row.clicks || 0),
        impressions: Math.round(row.impressions || 0),
        ctr:         ((row.ctr || 0) * 100).toFixed(1),
        position:    (row.position || 0).toFixed(1),
        topKeywords: keywords.data.rows?.map(r => ({ keyword: r.keys[0], clicks: r.clicks, pos: r.position?.toFixed(1) })) || [],
      };
    } catch (e) { log(`[stats] GSC (${siteUrl}): ${e.message}`); }
  }
  return null;
}

// ── AI citations — multi-engine ───────────────────────────────────────────────
const AI_QUERIES = [
  'Quelles sont les meilleures plateformes de recrutement au Maroc en 2026 ?',
  'Où trouver des offres d\'emploi au Maroc ?',
];

function checkMention(text) {
  const t = text.toLowerCase();
  const mentioned = t.includes('interactjob');
  const idx = t.indexOf('interactjob');
  return { mentioned, snippet: mentioned ? text.substring(Math.max(0, idx - 20), idx + 60).trim() : null };
}

async function checkAICitations() {
  const results = {};

  // Claude
  try {
    const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const texts = await Promise.all(AI_QUERIES.map(q =>
      claude.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: q }] }).then(r => r.content[0].text)
    ));
    results.claude = checkMention(texts.join(' '));
  } catch (e) { log(`[stats] Claude citation error: ${e.message}`); results.claude = null; }

  // Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const texts = await Promise.all(AI_QUERIES.map(async q => {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: q }] }] }),
          signal: AbortSignal.timeout(15000),
        });
        const json = await res.json();
        return json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }));
      results.gemini = checkMention(texts.join(' '));
    } catch (e) { log(`[stats] Gemini citation error: ${e.message}`); results.gemini = null; }
  }

  // ChatGPT (OpenAI)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const texts = await Promise.all(AI_QUERIES.map(async q => {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: q }] }),
          signal: AbortSignal.timeout(15000),
        });
        const json = await res.json();
        return json?.choices?.[0]?.message?.content || '';
      }));
      results.chatgpt = checkMention(texts.join(' '));
    } catch (e) { log(`[stats] ChatGPT citation error: ${e.message}`); results.chatgpt = null; }
  }

  return results;
}

// ── Bing SEO + AI stats ───────────────────────────────────────────────────────
async function getBingStats(yesterdayStr) {
  const apiKey  = process.env.BING_API_KEY;
  const siteUrl = 'https://www.interactjob.ma/';
  if (!apiKey) return null;

  // SEO query stats (last 30 days rolling)
  let seo = null;
  try {
    const res  = await fetch(`https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats?siteUrl=${encodeURIComponent(siteUrl)}&apikey=${apiKey}`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const json = await res.json();
      const rows = json?.d || [];
      if (rows.length) {
        const totals = rows.reduce((acc, r) => { acc.impressions += r.Impressions || 0; acc.clicks += r.Clicks || 0; return acc; }, { impressions: 0, clicks: 0 });
        seo = { impressions: totals.impressions, clicks: totals.clicks, avgPos: rows[0]?.AvgImpressionPosition?.toFixed(1) || '—' };
      }
    }
  } catch (e) { log(`[stats] Bing SEO error: ${e.message}`); }

  return seo || null;
}

// ── MongoDB stats ──────────────────────────────────────────────────────────────
async function getMongoStats(todayStart, todayEnd, monthStart, monthEnd, yesterdayStart) {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  try {
    const [
      total, newToday, newYest,
      cvToday, cvMonth,
      persPaidToday, persPaidMonth,
      persFreeToday, persFreeMonth,
      annToday, annMonth,
      liProcessed, liPending,
    ] = await Promise.all([
      db.collection('candidates').countDocuments(),
      db.collection('candidates').countDocuments({ submittedAt: { $gte: todayStart.toISOString(), $lt: todayEnd.toISOString() } }),
      db.collection('candidates').countDocuments({ submittedAt: { $gte: yesterdayStart.toISOString(), $lt: todayStart.toISOString() } }),
      db.collection('cvcheckusages').countDocuments({ checkedAt: { $gte: todayStart.toISOString(), $lt: todayEnd.toISOString() } }),
      db.collection('cvcheckusages').countDocuments({ checkedAt: { $gte: monthStart.toISOString(), $lt: monthEnd.toISOString() } }),
      db.collection('personality_assessments').countDocuments({ isPremium: true,        createdAt: { $gte: todayStart, $lt: todayEnd } }),
      db.collection('personality_assessments').countDocuments({ isPremium: true,        createdAt: { $gte: monthStart, $lt: monthEnd } }),
      db.collection('personality_assessments').countDocuments({ isPremium: { $ne: true }, createdAt: { $gte: todayStart, $lt: todayEnd } }),
      db.collection('personality_assessments').countDocuments({ isPremium: { $ne: true }, createdAt: { $gte: monthStart, $lt: monthEnd } }),
      db.collection('jobpayments').countDocuments({ createdAt: { $gte: todayStart, $lt: todayEnd } }),
      db.collection('jobpayments').countDocuments({ createdAt: { $gte: monthStart, $lt: monthEnd } }),
      db.collection('linkedin_messages').countDocuments({ processed_at: { $gte: todayStart.toISOString(), $lt: todayEnd.toISOString() } }),
      db.collection('linkedin_messages').countDocuments({ status: 'pending' }),
    ]);
    const revenueToday = persPaidToday * PERSONALITY_PRICE + annToday * ANNONCE_PRICE;
    const revenueMonth = persPaidMonth * PERSONALITY_PRICE + annMonth * ANNONCE_PRICE;
    return {
      candidates: { total, today: newToday, yesterday: newYest },
      cv:  { today: cvToday, month: cvMonth },
      pers: { paidToday: persPaidToday, paidMonth: persPaidMonth, freeToday: persFreeToday, freeMonth: persFreeMonth },
      ann: { today: annToday, month: annMonth },
      revenue: { today: revenueToday, month: revenueMonth },
      linkedin: { processed: liProcessed, pending: liPending },
    };
  } finally { await client.close(); }
}

// ── Remote jobs stats from remote-jobs.json ───────────────────────────────────
function getRemoteJobsStats(yesterdayStr) {
  try {
    const REMOTE_PATH = path.join(__dirname_stats, '../data/remote-jobs.json');
    const jobs = JSON.parse(readFileSync(REMOTE_PATH, 'utf8'));
    const total   = jobs.length;
    const newYest = jobs.filter(j => (j.published || '').startsWith(yesterdayStr)).length;
    return { total, newYest };
  } catch { return null; }
}

// ── Jobs stats from jobs.json ─────────────────────────────────────────────────
function getJobsStats(yesterdayStr) {
  try {
    const jobs = JSON.parse(readFileSync(JOBS_PATH, 'utf8'));
    const total    = jobs.length;
    const employer = jobs.filter(j => j.source === 'Direct' || j.sponsored || j.featured).length;
    const rss      = total - employer;
    // New jobs posted yesterday
    const newYest  = jobs.filter(j => (j.date_scraped || j.postedAt || '')?.startsWith(yesterdayStr)).length;
    const newEmployerYest = jobs.filter(j => (j.source === 'Direct' || j.sponsored || j.featured) && (j.postedAt || j.date_scraped || '')?.startsWith(yesterdayStr)).length;
    return { total, rss, employer, newYest, newEmployerYest, newRSSYest: newYest - newEmployerYest };
  } catch { return null; }
}

// ── Save daily snapshot ────────────────────────────────────────────────────────
async function saveDaily(dateStr, snapshot) {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    const col = client.db(DB_NAME).collection(STATS_COL);
    await col.updateOne({ date: dateStr }, { $set: { date: dateStr, savedAt: new Date().toISOString(), ...snapshot } }, { upsert: true });
    log(`[stats] Snapshot ${dateStr} sauvegardé`);
  } finally { await client.close(); }
}

// ── Load range of daily snapshots ─────────────────────────────────────────────
async function loadRange(fromDate, toDate) {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  try {
    return await client.db(DB_NAME).collection(STATS_COL)
      .find({ date: { $gte: fromDate, $lte: toDate } })
      .sort({ date: 1 }).toArray();
  } finally { await client.close(); }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function bar(v, max, w = 8) {
  const p = max > 0 ? Math.min(1, v / max) : 0;
  const f = Math.round(p * w);
  return '▓'.repeat(f) + '░'.repeat(w - f) + ` ${Math.round(p * 100)}%`;
}
function dur(s) { const m = Math.floor(s / 60); return m > 0 ? `${m}m${Math.round(s % 60)}s` : `${Math.round(s)}s`; }
function fmt(d) { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Casablanca' }); }
function fmtFull(d) { return new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Casablanca' }); }

// Maps sessionSourceMedium values to display labels
function sourceLabel(sm) {
  const s = sm.toLowerCase();
  if (s.includes('chatgpt') || s.includes('openai'))        return '🤖 ChatGPT';
  if (s.includes('perplexity'))                              return '🤖 Perplexity';
  if (s.includes('gemini') || s.includes('bard'))           return '🤖 Gemini';
  if (s.includes('copilot') || (s.includes('bing') && s.includes('referral'))) return '🤖 Copilot/Bing';
  if (s.includes('linkedin') || s.includes('lnkd.in'))      return '💼 LinkedIn';
  if (s.includes('facebook') || s.includes('fb.com'))       return '👥 Facebook';
  if (s.includes('instagram'))                               return '📸 Instagram';
  if (s.includes('twitter') || s.includes('t.co'))          return '🐦 Twitter/X';
  if (s.includes('tiktok'))                                  return '🎵 TikTok';
  if (s.includes('youtube'))                                 return '▶️ YouTube';
  if (s.includes('whatsapp'))                                return '💬 WhatsApp';
  if (s.includes('google') && s.includes('organic'))        return '🔍 Google (SEO)';
  if (s.includes('google') && s.includes('cpc'))            return '💰 Google Ads';
  if (s.includes('google'))                                  return '🔍 Google';
  if (s.includes('bing') && s.includes('organic'))          return '🔍 Bing (SEO)';
  if (s.includes('duckduckgo'))                              return '🔍 DuckDuckGo';
  if (s === '(direct) / (none)' || s === 'direct / (none)') return '🔗 Direct';
  if (s.includes('email') || s.includes('newsletter'))      return '📧 Email';
  if (s.includes('/ referral'))                             return `↩️ ${sm.split(' /')[0]}`;
  if (s.includes('unassigned') || s.includes('(not set)'))  return '❓ Non classé';
  return `🌐 ${sm.split(' /')[0]}`;
}
const COUNTRY_FLAG = { Morocco: '🇲🇦', France: '🇫🇷', Algeria: '🇩🇿', Tunisia: '🇹🇳', Belgium: '🇧🇪', Canada: '🇨🇦', Spain: '🇪🇸', Germany: '🇩🇪', 'United States': '🇺🇸', Netherlands: '🇳🇱', 'United Kingdom': '🇬🇧', Italy: '🇮🇹', 'United Arab Emirates': '🇦🇪', 'Saudi Arabia': '🇸🇦', Qatar: '🇶🇦', India: '🇮🇳', Kenya: '🇰🇪' };
function flag(country) { return (COUNTRY_FLAG[country] || '🌍') + ' ' + country; }

// ── DAILY REPORT ──────────────────────────────────────────────────────────────
export async function runStatsReporter() {
  log('[stats-reporter] Démarrage rapport quotidien...');

  const now   = new Date();
  const month = now.getMonth() + 1;
  const offset = 3600000; // UTC+1 Casablanca

  const todayStart    = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - offset);
  const todayEnd      = new Date(todayStart.getTime() + 86400000);
  const monthStart    = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1) - offset);
  const monthEnd      = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1) - offset);
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);

  const yesterdayStr  = yesterdayStart.toISOString().slice(0, 10);
  const todayStr      = todayStart.toISOString().slice(0, 10);
  const reportDateLabel = fmtFull(yesterdayStart);

  const scale      = MONTHLY_SCALE[month] || 0.12;
  const targetMonth = Math.round((DEC_TARGETS.cv + DEC_TARGETS.personality + DEC_TARGETS.annonces + DEC_TARGETS.services) * scale);

  const gauth = buildGoogleAuth();
  const [mongo, health, ga4, gsc, aiCitations, bing] = await Promise.all([
    getMongoStats(todayStart, todayEnd, monthStart, monthEnd, yesterdayStart).catch(e => { log(`[stats] MongoDB: ${e.message}`); return null; }),
    checkSiteHealth(),
    getGA4Stats(gauth, yesterdayStr, yesterdayStr),
    getGSCStats(gauth, yesterdayStr, yesterdayStr),
    checkAICitations(),
    getBingStats(yesterdayStr),
  ]);
  const jobs       = getJobsStats(yesterdayStr);
  const remoteJobs = getRemoteJobsStats(yesterdayStr);

  // ── Build message ────────────────────────────────────────────────────────────
  let msg = `📊 <b>Rapport InteractJob — ${reportDateLabel}</b>\n`;
  msg += `${'─'.repeat(32)}\n\n`;

  msg += `⚡ <b>SANTÉ DU SITE</b>\n`;
  msg += `${health.ok ? '✅' : '🔴'} interactjob.ma — ${health.ok ? health.ms + 'ms' : 'HORS LIGNE'}\n\n`;

  if (ga4) {
    msg += `🌐 <b>TRAFIC — ${fmt(yesterdayStart)}</b>\n`;
    msg += `├ Sessions    : <b>${ga4.sessions}</b>\n`;
    msg += `├ Utilisateurs: <b>${ga4.users}</b> (${ga4.newUsers} nouveaux)\n`;
    msg += `├ Pages vues  : <b>${ga4.pageviews}</b>\n`;
    msg += `├ Rebond      : <b>${ga4.bounceRate}%</b>\n`;
    msg += `└ Durée moy.  : <b>${dur(ga4.avgDuration)}</b>\n\n`;

    if (ga4.channels.length > 0) {
      // Aggregate rows with the same display label (GA4 splits by medium)
      const merged = {};
      ga4.channels.forEach(ch => {
        const label = sourceLabel(ch.source);
        merged[label] = (merged[label] || 0) + ch.sessions;
      });
      const sorted = Object.entries(merged).sort((a, b) => b[1] - a[1]);
      const total  = sorted.reduce((s, [, v]) => s + v, 0);
      msg += `📡 <b>SOURCES DE TRAFIC</b>\n`;
      sorted.forEach(([label, sessions], i) => {
        const pct    = total > 0 ? Math.round(sessions / total * 100) : 0;
        const isLast = i === sorted.length - 1;
        msg += `${isLast ? '└' : '├'} ${escHtml(label)}: <b>${sessions}</b> (${pct}%)\n`;
      });
      msg += '\n';
    }

    if (ga4.countries.length > 0) {
      msg += `🌍 <b>PAYS D'ORIGINE</b>\n`;
      ga4.countries.forEach((c, i) => {
        msg += `${i === ga4.countries.length - 1 ? '└' : '├'} ${escHtml(flag(c.name))}: <b>${c.sessions}</b>\n`;
      });
      msg += '\n';
    }

    if (ga4.topPages.length > 0) {
      msg += `📄 <b>TOP PAGES</b>\n`;
      ga4.topPages.forEach((p, i) => {
        msg += `${i === ga4.topPages.length - 1 ? '└' : '├'} <code>${escHtml(p.path)}</code> — ${p.views} vues\n`;
      });
      msg += '\n';
    }
  } else {
    msg += `🌐 <b>TRAFIC</b> — Non configuré\n\n`;
  }

  if (mongo) {
    msg += `👥 <b>ACTIVITÉ — ${fmt(todayStart)}</b>\n`;
    msg += `├ Candidats total  : <b>${mongo.candidates.total}</b> (+${mongo.candidates.today} auj.)\n`;
    msg += `├ CV Checker        : ${mongo.cv.today} auj. / ${mongo.cv.month} ce mois (🆓 gratuit)\n`;
    msg += `├ Test perso gratuit: ${mongo.pers.freeToday} auj. / ${mongo.pers.freeMonth} ce mois\n`;
    msg += `├ Test perso premium: ${mongo.pers.paidToday} auj. / ${mongo.pers.paidMonth} ce mois\n`;
    msg += `└ Annonces payantes : ${mongo.ann.today} auj. / ${mongo.ann.month} ce mois\n\n`;

    if (jobs) {
      msg += `📋 <b>OFFRES D'EMPLOI</b>\n`;
      msg += `├ Total Maroc     : <b>${jobs.total}</b>\n`;
      msg += `├ 📡 RSS (scraping) : <b>${jobs.rss}</b>`;
      if (jobs.newRSSYest > 0) msg += ` (+${jobs.newRSSYest} hier)`;
      msg += `\n`;
      msg += `├ 🏢 Employeurs directs : <b>${jobs.employer}</b>`;
      if (jobs.newEmployerYest > 0) msg += ` (+${jobs.newEmployerYest} hier)`;
      msg += `\n`;
      if (remoteJobs) {
        msg += `└ 🌍 Remote (mondial) : <b>${remoteJobs.total}</b>`;
        if (remoteJobs.newYest > 0) msg += ` (+${remoteJobs.newYest} hier)`;
        msg += `\n`;
      }
      msg += `\n`;
    }

    const mLabel = now.toLocaleString('fr-FR', { month: 'long', timeZone: 'Africa/Casablanca' });
    msg += `💰 <b>REVENUS (${mLabel})</b>\n`;
    msg += `├ Aujourd'hui : <b>${mongo.revenue.today} MAD</b>\n`;
    msg += `├ Ce mois     : <b>${mongo.revenue.month} MAD</b> / objectif ${targetMonth} MAD\n`;
    msg += `└ ${bar(mongo.revenue.month, targetMonth)}\n\n`;
  }

  if (gsc) {
    msg += `🔍 <b>SEO — ${fmt(yesterdayStart)}</b>\n`;
    msg += `├ Clics : <b>${gsc.clicks}</b> | Impressions : <b>${gsc.impressions}</b> | CTR : <b>${gsc.ctr}%</b>\n`;
    msg += `└ Position moy. : <b>${gsc.position}</b>\n`;
    if (gsc.topKeywords.length > 0) {
      msg += `   ${gsc.topKeywords.slice(0, 3).map(k => `"${escHtml(k.keyword)}" (${k.clicks})`).join(' · ')}\n`;
    }
    msg += '\n';
  } else {
    msg += `🔍 <b>SEO</b> — Ajouter compte dans Search Console\n\n`;
  }

  if (bing) {
    msg += `🔵 <b>SEO BING (30j)</b>\n`;
    msg += `├ Impressions : <b>${bing.impressions.toLocaleString('fr-FR')}</b>\n`;
    msg += `├ Clics       : <b>${bing.clicks}</b>\n`;
    msg += `└ Position    : <b>${bing.avgPos}</b>\n\n`;
  }

  msg += `🤖 <b>CITATIONS IA</b>\n`;
  const engines = [
    ['Claude',     aiCitations?.claude],
    ['Gemini',     aiCitations?.gemini],
    ['ChatGPT',    aiCitations?.chatgpt],
  ].filter(([, v]) => v !== undefined);
  if (engines.length === 0) {
    msg += `└ ❌ Aucun moteur configuré\n`;
  } else {
    engines.forEach(([name, result], i) => {
      const prefix = i === engines.length - 1 ? '└' : '├';
      if (!result)           msg += `${prefix} ${name} : ❌ erreur\n`;
      else if (result.mentioned) msg += `${prefix} ✅ <b>${name}</b> : Mentionné !${result.snippet ? ` "…${escHtml(result.snippet)}…"` : ''}\n`;
      else                   msg += `${prefix} ❌ ${name} : Non mentionné\n`;
    });
  }
  msg += `   📊 <a href="https://www.bing.com/webmasters/aiperf">Bing AI Perf →</a>\n`;

  msg += `\n${'─'.repeat(32)}\n`;
  msg += `🔗 <a href="${SITE_URL}/admin">Dashboard</a>`;

  await sendTelegram(msg);

  // ── Save snapshot ────────────────────────────────────────────────────────────
  const snapshot = { ga4: ga4 || null, gsc: gsc || null, mongo: mongo || null, health, aiCitations: aiCitations || null };
  await saveDaily(yesterdayStr, snapshot).catch(e => log(`[stats] Save error: ${e.message}`));

  log('[stats-reporter] ✓ Rapport quotidien envoyé');
}

// ── WEEKLY REPORT ─────────────────────────────────────────────────────────────
export async function runWeeklyReport() {
  log('[stats-reporter] Rapport hebdomadaire...');
  const now = new Date();
  const toDate   = new Date(now.getTime() - 86400000).toISOString().slice(0, 10); // hier
  const fromDate = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10); // -7j

  const days = await loadRange(fromDate, toDate).catch(() => []);
  if (days.length === 0) { log('[stats] Pas de données hebdo'); return; }

  const totalSessions  = days.reduce((s, d) => s + (d.ga4?.sessions || 0), 0);
  const totalPageviews = days.reduce((s, d) => s + (d.ga4?.pageviews || 0), 0);
  const totalUsers     = days.reduce((s, d) => s + (d.ga4?.users || 0), 0);
  const avgBounce      = days.filter(d => d.ga4).reduce((s, d) => s + parseFloat(d.ga4.bounceRate), 0) / Math.max(1, days.filter(d => d.ga4).length);
  const totalRevenue   = days.reduce((s, d) => s + (d.mongo?.revenue?.today || 0), 0);
  const totalCandidates = (days[days.length - 1]?.mongo?.candidates?.total || 0) - (days[0]?.mongo?.candidates?.total || 0);
  const totalCv        = days.reduce((s, d) => s + (d.mongo?.cv?.today || 0), 0);

  // Aggregate channels
  const channelMap = {};
  days.forEach(d => (d.ga4?.channels || []).forEach(c => {
    const key = sourceLabel(c.source || c.name || '');
    channelMap[key] = (channelMap[key] || 0) + c.sessions;
  }));
  const topChannels = Object.entries(channelMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Aggregate countries
  const countryMap = {};
  days.forEach(d => (d.ga4?.countries || []).forEach(c => {
    countryMap[c.name] = (countryMap[c.name] || 0) + c.sessions;
  }));
  const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  let msg = `📈 <b>Rapport hebdomadaire InteractJob</b>\n`;
  msg += `📅 ${fmt(fromDate + 'T00:00:00Z')} → ${fmt(toDate + 'T00:00:00Z')}\n`;
  msg += `${'─'.repeat(32)}\n\n`;

  msg += `🌐 <b>TRAFIC</b>\n`;
  msg += `├ Sessions totales : <b>${totalSessions}</b> (moy. ${Math.round(totalSessions / days.length)}/j)\n`;
  msg += `├ Utilisateurs     : <b>${totalUsers}</b>\n`;
  msg += `├ Pages vues       : <b>${totalPageviews}</b>\n`;
  msg += `└ Taux de rebond   : <b>${avgBounce.toFixed(1)}%</b>\n\n`;

  if (topChannels.length > 0) {
    const tot = topChannels.reduce((s, c) => s + c[1], 0);
    msg += `📡 <b>SOURCES</b>\n`;
    topChannels.forEach(([name, sessions], i) => {
      const pct = Math.round(sessions / tot * 100);
      msg += `${i === topChannels.length - 1 ? '└' : '├'} ${CHANNEL_FR[name] || name}: <b>${sessions}</b> (${pct}%)\n`;
    });
    msg += '\n';
  }

  if (topCountries.length > 0) {
    msg += `🌍 <b>PAYS</b>\n`;
    topCountries.forEach(([name, sessions], i) => {
      msg += `${i === topCountries.length - 1 ? '└' : '├'} ${flag(name)}: <b>${sessions}</b>\n`;
    });
    msg += '\n';
  }

  msg += `👥 <b>ACTIVITÉ</b>\n`;
  msg += `├ Nouveaux candidats : <b>+${Math.max(0, totalCandidates)}</b>\n`;
  msg += `└ CVs générés        : <b>${totalCv}</b>\n\n`;

  msg += `💰 <b>REVENUS SEMAINE : ${totalRevenue} MAD</b>\n\n`;

  msg += `${'─'.repeat(32)}\n`;
  msg += `🔗 <a href="${SITE_URL}/admin">Dashboard</a>`;

  await sendTelegram(msg);
  log('[stats-reporter] ✓ Rapport hebdo envoyé');
}

// ── MONTHLY REPORT ────────────────────────────────────────────────────────────
export async function runMonthlyReport() {
  log('[stats-reporter] Rapport mensuel...');
  const now   = new Date();
  const prevM = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const fromDate = prevM.toISOString().slice(0, 10);
  const toDate   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
  const monthLabel = prevM.toLocaleString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Africa/Casablanca' });

  const days = await loadRange(fromDate, toDate).catch(() => []);
  if (days.length === 0) { log('[stats] Pas de données mensuelles'); return; }

  const totalSessions  = days.reduce((s, d) => s + (d.ga4?.sessions || 0), 0);
  const totalUsers     = days.reduce((s, d) => s + (d.ga4?.users || 0), 0);
  const totalPageviews = days.reduce((s, d) => s + (d.ga4?.pageviews || 0), 0);
  const avgBounce      = (days.filter(d => d.ga4).reduce((s, d) => s + parseFloat(d.ga4.bounceRate), 0) / Math.max(1, days.filter(d => d.ga4).length)).toFixed(1);
  const totalRevenue   = days.reduce((s, d) => s + (d.mongo?.revenue?.today || 0), 0);
  const totalCv        = days.reduce((s, d) => s + (d.mongo?.cv?.today || 0), 0);
  const totalPers      = days.reduce((s, d) => s + (d.mongo?.pers?.today || 0), 0);
  const totalAnn       = days.reduce((s, d) => s + (d.mongo?.ann?.today || 0), 0);
  const bestDay        = [...days].sort((a, b) => (b.ga4?.sessions || 0) - (a.ga4?.sessions || 0))[0];

  const channelMap = {};
  days.forEach(d => (d.ga4?.channels || []).forEach(c => { channelMap[c.name] = (channelMap[c.name] || 0) + c.sessions; }));
  const topChannels = Object.entries(channelMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const countryMap = {};
  days.forEach(d => (d.ga4?.countries || []).forEach(c => { countryMap[c.name] = (countryMap[c.name] || 0) + c.sessions; }));
  const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  let msg = `📊 <b>Rapport mensuel InteractJob — ${monthLabel}</b>\n`;
  msg += `${'─'.repeat(32)}\n\n`;

  msg += `🌐 <b>TRAFIC</b>\n`;
  msg += `├ Sessions    : <b>${totalSessions.toLocaleString('fr-FR')}</b> (${days.length} jours)\n`;
  msg += `├ Utilisateurs: <b>${totalUsers.toLocaleString('fr-FR')}</b>\n`;
  msg += `├ Pages vues  : <b>${totalPageviews.toLocaleString('fr-FR')}</b>\n`;
  msg += `├ Moy/jour    : <b>${Math.round(totalSessions / days.length)}</b> sessions\n`;
  msg += `├ Rebond moy. : <b>${avgBounce}%</b>\n`;
  msg += `└ Meilleur jour: <b>${fmt(bestDay?.date + 'T12:00:00Z')}</b> (${bestDay?.ga4?.sessions || 0} sessions)\n\n`;

  if (topChannels.length > 0) {
    const tot = topChannels.reduce((s, c) => s + c[1], 0);
    msg += `📡 <b>SOURCES DU MOIS</b>\n`;
    topChannels.forEach(([name, sessions], i) => {
      const pct = Math.round(sessions / tot * 100);
      msg += `${i === topChannels.length - 1 ? '└' : '├'} ${CHANNEL_FR[name] || name}: <b>${sessions}</b> (${pct}%)\n`;
    });
    msg += '\n';
  }

  if (topCountries.length > 0) {
    msg += `🌍 <b>GÉOGRAPHIE</b>\n`;
    topCountries.forEach(([name, sessions], i) => {
      msg += `${i === topCountries.length - 1 ? '└' : '├'} ${flag(name)}: <b>${sessions}</b>\n`;
    });
    msg += '\n';
  }

  msg += `👥 <b>BUSINESS</b>\n`;
  msg += `├ CVs générés         : <b>${totalCv}</b> (${totalCv * CV_PRICE} MAD)\n`;
  msg += `├ Tests personnalité  : <b>${totalPers}</b> (${totalPers * PERSONALITY_PRICE} MAD)\n`;
  msg += `└ Annonces sponsorisées: <b>${totalAnn}</b> (${totalAnn * ANNONCE_PRICE} MAD)\n\n`;

  msg += `💰 <b>REVENU TOTAL DU MOIS : ${totalRevenue.toLocaleString('fr-FR')} MAD</b>\n\n`;

  msg += `${'─'.repeat(32)}\n`;
  msg += `📎 Business review PPTX généré séparément\n`;
  msg += `🔗 <a href="${SITE_URL}/admin">Dashboard</a>`;

  await sendTelegram(msg);
  log('[stats-reporter] ✓ Rapport mensuel envoyé');
}

// ── MONTHLY BUSINESS REVIEW (PPTX) ───────────────────────────────────────────
export async function runMonthlyReview() {
  log('[stats-reporter] Génération Business Review...');
  const { default: PptxGenJS } = await import('pptxgenjs');

  const now    = new Date();
  const prevM  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const fromDate = prevM.toISOString().slice(0, 10);
  const toDate   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
  const monthLabel = prevM.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const monthNum   = String(prevM.getMonth() + 1).padStart(2, '0');
  const yearNum    = prevM.getFullYear();

  const days = await loadRange(fromDate, toDate).catch(() => []);

  const totalSessions  = days.reduce((s, d) => s + (d.ga4?.sessions || 0), 0);
  const totalUsers     = days.reduce((s, d) => s + (d.ga4?.users || 0), 0);
  const totalRevenue   = days.reduce((s, d) => s + (d.mongo?.revenue?.today || 0), 0);
  const totalCv        = days.reduce((s, d) => s + (d.mongo?.cv?.today || 0), 0);
  const totalPers      = days.reduce((s, d) => s + (d.mongo?.pers?.today || 0), 0);
  const totalAnn       = days.reduce((s, d) => s + (d.mongo?.ann?.today || 0), 0);
  const avgBounce      = (days.filter(d => d.ga4).reduce((s, d) => s + parseFloat(d.ga4.bounceRate), 0) / Math.max(1, days.filter(d => d.ga4).length)).toFixed(1);
  const lastCandidates = days[days.length - 1]?.mongo?.candidates?.total || 0;

  const channelMap = {};
  days.forEach(d => (d.ga4?.channels || []).forEach(c => { channelMap[c.name] = (channelMap[c.name] || 0) + c.sessions; }));
  const topChannels = Object.entries(channelMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const countryMap = {};
  days.forEach(d => (d.ga4?.countries || []).forEach(c => { countryMap[c.name] = (countryMap[c.name] || 0) + c.sessions; }));
  const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Daily sessions for trend chart
  const trendLabels = days.map(d => d.date.slice(5)); // MM-DD
  const trendValues = days.map(d => d.ga4?.sessions || 0);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

  const BLUE  = '0A2D6E';
  const CYAN  = '00BCD4';
  const WHITE = 'FFFFFF';
  const GRAY  = 'F4F6F9';
  const DARK  = '1A1A2E';

  const slide1 = (title, subtitle) => {
    const s = pptx.addSlide();
    s.background = { color: BLUE };
    s.addText('InteractJob.ma', { x: 0.5, y: 0.4, w: 12, h: 0.6, fontSize: 18, color: CYAN, bold: true, fontFace: 'Arial' });
    s.addText(title, { x: 0.5, y: 2.5, w: 12, h: 1.2, fontSize: 44, color: WHITE, bold: true, fontFace: 'Arial', align: 'center' });
    s.addText(subtitle, { x: 0.5, y: 3.9, w: 12, h: 0.6, fontSize: 20, color: CYAN, fontFace: 'Arial', align: 'center' });
    s.addText(`Rapport généré le ${new Date().toLocaleDateString('fr-FR')}`, { x: 0.5, y: 6.8, w: 12, h: 0.4, fontSize: 11, color: 'AAAACC', fontFace: 'Arial', align: 'center' });
    return s;
  };

  const slideTitle = (s, title) => {
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 1.0, fill: { color: BLUE } });
    s.addText(title, { x: 0.4, y: 0.15, w: 12.5, h: 0.7, fontSize: 22, color: WHITE, bold: true, fontFace: 'Arial' });
  };

  const kpiBox = (s, x, y, w, h, label, value, sub, color = BLUE) => {
    s.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color }, line: { color, width: 0 }, rectRadius: 0.1 });
    s.addText(label, { x, y: y + 0.08, w, h: 0.35, fontSize: 11, color: WHITE, align: 'center', fontFace: 'Arial' });
    s.addText(value, { x, y: y + 0.42, w, h: 0.65, fontSize: 28, color: WHITE, bold: true, align: 'center', fontFace: 'Arial' });
    if (sub) s.addText(sub, { x, y: y + 1.05, w, h: 0.28, fontSize: 10, color: 'DDDDFF', align: 'center', fontFace: 'Arial' });
  };

  // Slide 1 — Cover
  slide1(`Business Review\n${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`, 'Rapport mensuel de performance');

  // Slide 2 — KPIs clés
  {
    const s = pptx.addSlide();
    s.background = { color: GRAY };
    slideTitle(s, '📊 KPIs Clés du Mois');
    const targets = [
      [0.3, 1.2, 2.8, 1.5, 'Sessions', totalSessions.toLocaleString('fr-FR'), `${Math.round(totalSessions / Math.max(1, days.length))}/jour`, BLUE],
      [3.3, 1.2, 2.8, 1.5, 'Utilisateurs', totalUsers.toLocaleString('fr-FR'), `${days.length} jours de données`, '1565A8'],
      [6.3, 1.2, 2.8, 1.5, 'Taux de rebond', avgBounce + '%', 'Moyenne mensuelle', avgBounce < 50 ? '2E7D32' : avgBounce < 65 ? 'F57C00' : 'C62828'],
      [9.3, 1.2, 2.8, 1.5, 'Revenu total', totalRevenue.toLocaleString('fr-FR') + ' MAD', 'Tous services', '00695C'],
      [0.3, 2.9, 2.8, 1.5, 'Candidats', lastCandidates.toString(), 'Total talent pool', BLUE],
      [3.3, 2.9, 2.8, 1.5, 'CVs générés', totalCv.toString(), `${totalCv * CV_PRICE} MAD`, CYAN],
      [6.3, 2.9, 2.8, 1.5, 'Tests perso.', totalPers.toString(), `${totalPers * PERSONALITY_PRICE} MAD`, '6A1B9A'],
      [9.3, 2.9, 2.8, 1.5, 'Annonces spon.', totalAnn.toString(), `${totalAnn * ANNONCE_PRICE} MAD`, 'E65100'],
    ];
    targets.forEach(([x, y, w, h, l, v, sub, c]) => kpiBox(s, x, y, w, h, l, v, sub, c));
  }

  // Slide 3 — Trafic (trend chart)
  if (trendValues.some(v => v > 0)) {
    const s = pptx.addSlide();
    s.background = { color: GRAY };
    slideTitle(s, '🌐 Évolution du Trafic');
    s.addChart(pptx.ChartType.line, [{ name: 'Sessions', labels: trendLabels, values: trendValues }], {
      x: 0.4, y: 1.1, w: 12.5, h: 4.8,
      chartColors: [BLUE],
      lineDataSymbol: 'none',
      lineSmooth: true,
      showLegend: false,
      valAxisTitle: 'Sessions',
      catAxisTitle: 'Jour',
      showTitle: false,
      catGridLine: { style: 'none' },
      valGridLine: { style: 'dash', color: 'CCCCCC' },
    });
    s.addText(`Total : ${totalSessions.toLocaleString('fr-FR')} sessions · Moyenne : ${Math.round(totalSessions / Math.max(1, days.length))}/jour`, {
      x: 0.4, y: 6.1, w: 12.5, h: 0.35, fontSize: 11, color: DARK, align: 'center', fontFace: 'Arial',
    });
  }

  // Slide 4 — Sources de trafic
  if (topChannels.length > 0) {
    const s = pptx.addSlide();
    s.background = { color: GRAY };
    slideTitle(s, '📡 Sources de Trafic');
    const totCh = topChannels.reduce((sum, c) => sum + c[1], 0);
    s.addChart(pptx.ChartType.bar, [{ name: 'Sessions', labels: topChannels.map(c => CHANNEL_FR[c[0]] || c[0]), values: topChannels.map(c => c[1]) }], {
      x: 0.4, y: 1.1, w: 7.0, h: 5.0,
      chartColors: [BLUE, CYAN, '1565A8', '00897B', '6A1B9A'],
      showValue: true, dataLabelFontSize: 11,
      barDir: 'bar',
      showLegend: false,
    });
    let ty = 1.3;
    topChannels.forEach(([name, sessions]) => {
      const pct = Math.round(sessions / totCh * 100);
      s.addText(`${CHANNEL_FR[name] || name}`, { x: 7.8, y: ty, w: 4.0, h: 0.35, fontSize: 12, color: DARK, fontFace: 'Arial' });
      s.addText(`${sessions} sess. · ${pct}%`, { x: 7.8, y: ty + 0.35, w: 4.0, h: 0.28, fontSize: 11, color: '555555', fontFace: 'Arial' });
      ty += 0.85;
    });
  }

  // Slide 5 — Géographie
  if (topCountries.length > 0) {
    const s = pptx.addSlide();
    s.background = { color: GRAY };
    slideTitle(s, '🌍 Géographie des Visiteurs');
    const totC = topCountries.reduce((sum, c) => sum + c[1], 0);
    s.addChart(pptx.ChartType.doughnut, [{ name: 'Sessions', labels: topCountries.map(c => c[0]), values: topCountries.map(c => c[1]) }], {
      x: 0.4, y: 1.1, w: 6.0, h: 5.0,
      chartColors: [BLUE, CYAN, '1565A8', '00897B', '6A1B9A', 'E65100'],
      showLegend: true, legendPos: 'b',
      showPercent: true, dataLabelFontSize: 10,
    });
    let ty = 1.5;
    topCountries.forEach(([name, sessions]) => {
      const pct = Math.round(sessions / totC * 100);
      s.addText(`${COUNTRY_FLAG[name] || '🌍'} ${name}`, { x: 7.0, y: ty, w: 5.5, h: 0.35, fontSize: 13, color: DARK, fontFace: 'Arial' });
      s.addText(`${sessions} sessions — ${pct}%`, { x: 7.0, y: ty + 0.35, w: 5.5, h: 0.28, fontSize: 11, color: '555555', fontFace: 'Arial' });
      ty += 0.85;
    });
  }

  // Slide 6 — Revenus
  {
    const s = pptx.addSlide();
    s.background = { color: GRAY };
    slideTitle(s, '💰 Performance Business & Revenus');
    const revenueData = [
      ['CVs générés',       totalCv,   CV_PRICE,          BLUE],
      ['Tests personnalité',totalPers,  PERSONALITY_PRICE, CYAN],
      ['Annonces spon.',    totalAnn,   ANNONCE_PRICE,     '00695C'],
    ];
    const revenueByService = revenueData.map(([l, q, p]) => ({ l, q, rev: q * p }));
    s.addChart(pptx.ChartType.bar, [{
      name: 'Revenus (MAD)',
      labels: revenueByService.map(r => r.l),
      values: revenueByService.map(r => r.rev),
    }], {
      x: 0.4, y: 1.1, w: 7.0, h: 4.0,
      chartColors: [BLUE, CYAN, '00695C'],
      showValue: true, dataLabelFontSize: 11,
      barDir: 'col', showLegend: false,
    });
    let ty = 1.3;
    revenueByService.forEach(r => {
      s.addText(r.l, { x: 7.8, y: ty, w: 4.8, h: 0.35, fontSize: 12, color: DARK, fontFace: 'Arial', bold: true });
      s.addText(`${r.q} unités × ${r.rev > 0 ? (r.rev / Math.max(1, r.q)).toFixed(0) : 0} MAD = ${r.rev.toLocaleString('fr-FR')} MAD`, { x: 7.8, y: ty + 0.35, w: 4.8, h: 0.3, fontSize: 10, color: '444444', fontFace: 'Arial' });
      ty += 1.0;
    });
    s.addShape(pptx.ShapeType.roundRect, { x: 7.8, y: ty + 0.3, w: 4.8, h: 0.8, fill: { color: BLUE }, rectRadius: 0.08 });
    s.addText(`TOTAL : ${totalRevenue.toLocaleString('fr-FR')} MAD`, { x: 7.8, y: ty + 0.42, w: 4.8, h: 0.55, fontSize: 16, color: WHITE, bold: true, align: 'center', fontFace: 'Arial' });
  }

  // Slide 7 — Résumé & objectifs
  {
    const s = pptx.addSlide();
    s.background = { color: BLUE };
    s.addText('Résumé & Objectifs', { x: 0.5, y: 0.3, w: 12.3, h: 0.7, fontSize: 26, color: WHITE, bold: true, fontFace: 'Arial' });
    const points = [
      `✅  ${totalSessions.toLocaleString('fr-FR')} sessions en ${monthLabel} (${days.length} jours de données)`,
      `✅  ${lastCandidates} candidats dans le talent pool`,
      `✅  ${totalRevenue.toLocaleString('fr-FR')} MAD de revenus (${totalCv} CVs · ${totalPers} tests · ${totalAnn} annonces)`,
      topChannels[0] ? `📊  Principale source : ${CHANNEL_FR[topChannels[0][0]] || topChannels[0][0]} (${topChannels[0][1]} sessions)` : '',
      topCountries[0] ? `🌍  Marché principal : ${topCountries[0][0]} (${topCountries[0][1]} sessions)` : '',
      `🎯  Objectif prochain mois : augmenter trafic +20% et revenus +15%`,
    ].filter(Boolean);
    points.forEach((p, i) => {
      s.addText(p, { x: 0.5, y: 1.2 + i * 0.75, w: 12.3, h: 0.6, fontSize: 15, color: i >= points.length - 1 ? CYAN : WHITE, fontFace: 'Arial' });
    });
  }

  // Write file
  const filename = `InteractJob-BusinessReview-${yearNum}-${monthNum}.pptx`;
  const filePath = path.join(os.tmpdir(), filename);
  await pptx.writeFile({ fileName: filePath });
  log(`[stats] PPTX généré : ${filePath}`);

  await sendTelegramDocument(filePath, `📊 Business Review InteractJob — ${monthLabel}\n${days.length} jours de données · ${totalSessions.toLocaleString('fr-FR')} sessions · ${totalRevenue.toLocaleString('fr-FR')} MAD`);

  try { unlinkSync(filePath); } catch {}
  log('[stats-reporter] ✓ Business Review envoyé');
}

// ── Direct run ─────────────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith('stats-reporter.js')) {
  import('dotenv/config').then(() => {
    const cmd = process.argv[2] || 'daily';
    const fn = { daily: runStatsReporter, weekly: runWeeklyReport, monthly: runMonthlyReport, review: runMonthlyReview }[cmd];
    if (!fn) { console.error('Usage: node stats-reporter.js [daily|weekly|monthly|review]'); process.exit(1); }
    fn().catch(e => { console.error(e); process.exit(1); });
  });
}
