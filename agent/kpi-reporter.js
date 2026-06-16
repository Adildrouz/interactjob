/**
 * InteractJob KPI Reporter
 *
 * Collects weekly data from Vercel Analytics, Google Search Console,
 * MongoDB, and LinkedIn (manual JSON file), generates an HTML report
 * via Claude Haiku, and emails it to ADMIN_EMAIL.
 *
 * Schedule: every Monday 07:00 UTC = 08:00 Africa/Casablanca
 *
 * Env vars required:
 *   ANTHROPIC_API_KEY, GMAIL_USER, GMAIL_APP_PASSWORD
 * Optional (data sources):
 *   VERCEL_TOKEN, VERCEL_PROJECT_ID
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY
 *   MONGODB_URI, ADMIN_EMAIL
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import nodemailer from 'nodemailer';
import Anthropic from '@anthropic-ai/sdk';
import { MongoClient } from 'mongodb';
import { google } from 'googleapis';
import { log } from './logger.js';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const LINKEDIN_PATH = path.join(__dirname, 'data', 'linkedin-weekly.json');
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL || 'adil.drouz@gmail.com';
const CC_EMAIL      = 'jobinteract@gmail.com';

// ── Objectives (monthly targets) ──────────────────────────────────────────────
const OBJECTIVES = {
  visitorsPerMonth:          15000,
  cvPaidPerWeek:             10,
  sponsoredPerWeek:          5,
  linkedinCombinedFollowers: 40000,
  revenuePerMonth:           48730,
};

// ── Date helpers ───────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function pct(a, b) {
  if (b == null || b === 0) return null;
  return Math.round(((a - b) / b) * 100);
}

function fmt(n) {
  if (n == null) return 'N/D';
  return Number(n).toLocaleString('fr-FR');
}

// ── GA4 from saved daily snapshots (MongoDB daily_stats collection) ────────────
async function fetchGA4FromSnapshots() {
  if (!process.env.MONGODB_URI) {
    log('[kpi] GA4 snapshots: MONGODB_URI manquant — skip');
    return null;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const col = client.db('interactjob').collection('daily_stats');

    const toDate   = isoDate(daysAgo(1));
    const fromDate = isoDate(daysAgo(7));
    const prevFrom = isoDate(daysAgo(14));
    const prevTo   = isoDate(daysAgo(8));

    const [thisDays, prevDays] = await Promise.all([
      col.find({ date: { $gte: fromDate, $lte: toDate } }).sort({ date: 1 }).toArray(),
      col.find({ date: { $gte: prevFrom, $lte: prevTo } }).sort({ date: 1 }).toArray(),
    ]);

    if (thisDays.length === 0) {
      log('[kpi] GA4 snapshots: aucune donnée cette semaine');
      return null;
    }

    const sum = (days, key) => days.reduce((acc, d) => acc + (d.ga4?.[key] || 0), 0);

    const visitors     = sum(thisDays, 'users');
    const pageviews    = sum(thisDays, 'pageviews');
    const prevVisitors = sum(prevDays, 'users');
    const prevPageviews= sum(prevDays, 'pageviews');

    // Aggregate top pages across days
    const pageMap = {};
    thisDays.forEach(d => (d.ga4?.topPages || []).forEach(p => {
      pageMap[p.path] = (pageMap[p.path] || 0) + p.views;
    }));
    const topPages = Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([path, views]) => ({ path, views }));

    // Aggregate top referrers (channels)
    const chanMap = {};
    thisDays.forEach(d => (d.ga4?.channels || []).forEach(c => {
      chanMap[c.source] = (chanMap[c.source] || 0) + c.sessions;
    }));
    const topReferrers = Object.entries(chanMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([source, sessions]) => ({ source, sessions }));

    log(`[kpi] GA4 snapshots: ${thisDays.length} jours — ${visitors} utilisateurs, ${pageviews} pages vues`);
    return {
      visitors,
      pageviews,
      prevVisitors,
      prevPageviews,
      visitorsWoW:  pct(visitors,   prevVisitors),
      pageviewsWoW: pct(pageviews,  prevPageviews),
      topPages,
      topReferrers,
    };
  } catch (err) {
    log(`[kpi] GA4 snapshots error: ${err.message}`);
    return null;
  } finally {
    await client.close();
  }
}

// ── Google Search Console ──────────────────────────────────────────────────────
async function fetchSearchConsole() {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !keyRaw) {
    log('[kpi] GSC: GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_SERVICE_ACCOUNT_KEY manquant — skip');
    return null;
  }

  try {
    const key  = keyRaw.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT(email, null, key, [
      'https://www.googleapis.com/auth/webmasters.readonly',
    ]);

    const sc      = google.searchconsole({ version: 'v1', auth });
    const siteUrl = 'sc-domain:interactjob.ma';
    const today   = isoDate(new Date());
    const w7      = isoDate(daysAgo(7));
    const w14     = isoDate(daysAgo(14));

    async function query(startDate, endDate) {
      const res = await sc.searchanalytics.query({
        siteUrl,
        requestBody: { startDate, endDate, dimensions: [], rowLimit: 1 },
      });
      const row = res.data.rows?.[0] || {};
      return {
        clicks:      Math.round(row.clicks      || 0),
        impressions: Math.round(row.impressions || 0),
        ctr:         row.ctr      ? Math.round(row.ctr      * 10000) / 100 : 0,
        position:    row.position ? Math.round(row.position * 10)    / 10  : 0,
      };
    }

    const [thisWeek, prevWeek] = await Promise.all([
      query(w7, today),
      query(w14, w7),
    ]);

    return {
      ...thisWeek,
      prevClicks:       prevWeek.clicks,
      prevImpressions:  prevWeek.impressions,
      clicksWoW:        pct(thisWeek.clicks,       prevWeek.clicks),
      impressionsWoW:   pct(thisWeek.impressions,  prevWeek.impressions),
    };
  } catch (err) {
    log(`[kpi] GSC error: ${err.message}`);
    return null;
  }
}

// ── MongoDB Stats ──────────────────────────────────────────────────────────────
async function fetchMongoStats() {
  if (!process.env.MONGODB_URI) {
    log('[kpi] MongoDB: MONGODB_URI manquant — skip');
    return null;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db    = client.db('interactjob');
    const since = daysAgo(7);

    const [cvTotal, cvPaid, personalityTotal, personalityPaid, sponsoredJobs, candidates, applications] = await Promise.all([
      db.collection('candidatecvs').countDocuments({ createdAt: { $gte: since } }),
      db.collection('candidatecvs').countDocuments({ isPremium: true, createdAt: { $gte: since } }),
      db.collection('personality_assessments').countDocuments({ createdAt: { $gte: since } }),
      db.collection('personality_assessments').countDocuments({ isPremium: true, updatedAt: { $gte: since } }),
      db.collection('x_posted_jobs').countDocuments({ postedAt: { $gte: since } }),
      db.collection('candidates').countDocuments(),
      db.collection('applications').countDocuments({ createdAt: { $gte: since } }).catch(() => 0),
    ]);

    // Read active jobs from jobs.json (flat file, not in Mongo)
    let activeJobs = null, directJobs = null;
    try {
      const { readFileSync } = await import('fs');
      const { fileURLToPath } = await import('url');
      const { default: path } = await import('path');
      const __d = path.dirname(fileURLToPath(import.meta.url));
      const jobs = JSON.parse(readFileSync(path.join(__d, '../data/jobs.json'), 'utf8'));
      activeJobs = jobs.length;
      directJobs = jobs.filter(j => j.source === 'Direct' || j.sponsored || j.featured).length;
    } catch {}

    const revenueMad = (cvPaid * 55) + (personalityPaid * 50);

    return { cvTotal, cvPaid, personalityTotal, personalityPaid, sponsoredJobs, revenueMad, activeJobs, directJobs, candidates, applications };
  } catch (err) {
    log(`[kpi] MongoDB error: ${err.message}`);
    return null;
  } finally {
    await client.close();
  }
}

// ── LinkedIn Stats (manual JSON) ───────────────────────────────────────────────
async function fetchLinkedInStats() {
  try {
    await fs.ensureDir(path.join(__dirname, 'data'));

    if (!(await fs.pathExists(LINKEDIN_PATH))) {
      const defaults = {
        week: isoDate(new Date()),
        followers_page: 0, followers_adil: 0,
        impressions_7j: 0, membres_touches: 0,
        engagement: 0, enregistrements: 0, envois: 0,
        nouveaux_abonnes_page: 0, nouveaux_abonnes_adil: 0,
        top_post_impressions: 0, top_post_titre: '',
      };
      await fs.writeJson(LINKEDIN_PATH, defaults, { spaces: 2 });
      log('[kpi] LinkedIn: linkedin-weekly.json créé avec valeurs par défaut');
    }

    const data = await fs.readJson(LINKEDIN_PATH);
    return {
      ...data,
      combined_followers: (data.followers_page || 0) + (data.followers_adil || 0),
    };
  } catch (err) {
    log(`[kpi] LinkedIn JSON error: ${err.message}`);
    return null;
  }
}

// ── Objectives Status ──────────────────────────────────────────────────────────
function buildObjectivesStatus({ vercel, mongo, linkedin }) {
  const visitorsMonthly = vercel  ? Math.round(vercel.visitors * 4.3) : null;
  const revenueMonthly  = mongo   ? Math.round(mongo.revenueMad * 4.3) : null;

  function status(current, target) {
    if (current == null) return '❓';
    if (current >= target)               return '✅';
    if (current >= target * 0.8)         return '⚠️';
    return '🔴';
  }

  return {
    visitors: {
      label:   'Visiteurs/mois',
      current: visitorsMonthly,
      target:  OBJECTIVES.visitorsPerMonth,
      status:  status(visitorsMonthly, OBJECTIVES.visitorsPerMonth),
      wow:     vercel?.visitorsWoW ?? null,
    },
    cvPaid: {
      label:   'CV payants/semaine',
      current: mongo?.cvPaid ?? null,
      target:  OBJECTIVES.cvPaidPerWeek,
      status:  status(mongo?.cvPaid, OBJECTIVES.cvPaidPerWeek),
      wow:     null,
    },
    sponsored: {
      label:   'Offres sponsorisées/semaine',
      current: mongo?.sponsoredJobs ?? null,
      target:  OBJECTIVES.sponsoredPerWeek,
      status:  status(mongo?.sponsoredJobs, OBJECTIVES.sponsoredPerWeek),
      wow:     null,
    },
    linkedin: {
      label:   'Abonnés LinkedIn combinés',
      current: linkedin?.combined_followers ?? null,
      target:  OBJECTIVES.linkedinCombinedFollowers,
      status:  status(linkedin?.combined_followers, OBJECTIVES.linkedinCombinedFollowers),
      wow:     null,
    },
    revenue: {
      label:   'Revenus/mois (MAD)',
      current: revenueMonthly,
      target:  OBJECTIVES.revenuePerMonth,
      status:  status(revenueMonthly, OBJECTIVES.revenuePerMonth),
      wow:     null,
    },
  };
}

// ── Forecast (4 weeks linear) ──────────────────────────────────────────────────
function buildForecast(vercel) {
  if (!vercel?.visitors) return null;
  const base       = vercel.visitors;
  const growthRate = vercel.visitorsWoW != null ? vercel.visitorsWoW / 100 : 0;
  return [1, 2, 3, 4].map((w) => ({
    week:     `S+${w}`,
    visitors: Math.round(base * Math.pow(1 + growthRate, w)),
    onTrack:  Math.round(base * Math.pow(1 + growthRate, w)) * 4.3 >= OBJECTIVES.visitorsPerMonth,
  }));
}

// ── Claude Report Generation ───────────────────────────────────────────────────
async function generateReport({ vercel, gsc, mongo, linkedin, objectives, forecast, weekLabel }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const payload = {
    semaine: weekLabel,
    vercel_analytics: vercel  ? {
      visiteurs_7j:   vercel.visitors,
      pageviews_7j:   vercel.pageviews,
      variation_wow:  vercel.visitorsWoW != null ? `${vercel.visitorsWoW > 0 ? '+' : ''}${vercel.visitorsWoW}%` : 'N/D',
      top_pages:      vercel.topPages,
      top_referrers:  vercel.topReferrers,
    } : null,
    google_search_console: gsc ? {
      clics_7j:       gsc.clicks,
      impressions_7j: gsc.impressions,
      ctr_moyen:      `${gsc.ctr}%`,
      position_moy:   gsc.position,
      clics_wow:      gsc.clicksWoW != null ? `${gsc.clicksWoW > 0 ? '+' : ''}${gsc.clicksWoW}%` : 'N/D',
    } : null,
    conversions_mongodb: mongo ? {
      cv_generes:       mongo.cvTotal,
      cv_payes:         mongo.cvPaid,
      tests_perso:      mongo.personalityTotal,
      tests_payes:      mongo.personalityPaid,
      offres_sponsorisees: mongo.sponsoredJobs,
      revenus_semaine_mad: mongo.revenueMad,
    } : null,
    linkedin: linkedin ? {
      abonnes_page:         linkedin.followers_page,
      abonnes_adil:         linkedin.followers_adil,
      abonnes_total:        linkedin.combined_followers,
      nouveaux_page:        linkedin.nouveaux_abonnes_page,
      nouveaux_adil:        linkedin.nouveaux_abonnes_adil,
      impressions_7j:       linkedin.impressions_7j,
      membres_touches:      linkedin.membres_touches,
      engagement:           linkedin.engagement,
      enregistrements:      linkedin.enregistrements,
      envois:               linkedin.envois,
      top_post:             `${linkedin.top_post_titre} (${fmt(linkedin.top_post_impressions)} impressions)`,
    } : null,
    objectifs_mensuels: Object.entries(objectives).map(([k, v]) => ({
      kpi:      v.label,
      realise:  v.current != null ? fmt(v.current) : 'N/D',
      objectif: fmt(v.target),
      statut:   v.status,
      wow:      v.wow != null ? `${v.wow > 0 ? '+' : ''}${v.wow}%` : '—',
    })),
    forecast_visiteurs_4semaines: forecast,
  };

  const res = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: `Tu es l'assistant analytique d'InteractJob. Génère un rapport KPI hebdomadaire professionnel en français.
Le rapport doit inclure: résumé exécutif en 3 bullets, tableau KPIs vs objectifs, meilleure performance de la semaine, alertes si quelque chose baisse de plus de 20%, forecast 4 semaines visiteurs, 3 recommandations concrètes et actionnables.
Sois direct, concis et orienté action.

IMPORTANT: Génère UNIQUEMENT du HTML valide, sans markdown, sans backticks.
Le HTML doit être un email responsive complet avec:
- Header avec le titre "📊 InteractJob KPI" et la date de la semaine
- Palette navy blue (#0A2D6E) et cyan (#00BCD4)
- Design responsive, max-width 680px centré, fond #f4f6f9
- Chaque section séparée par une ligne horizontale légère
- Tableau KPIs avec colonnes: Métrique | Réalisé | Objectif | Statut | Variation WoW
- ✅ objectif atteint, ⚠️ attention (>80%), 🔴 alerte (<80%)
- Si une donnée est null, affiche "N/D"
- Footer avec "Rapport généré automatiquement — InteractJob Agent"`,
    messages: [{
      role:    'user',
      content: `Données KPI semaine du ${weekLabel}:\n\n${JSON.stringify(payload, null, 2)}\n\nGénère le rapport HTML complet.`,
    }],
  });

  const html = res.content[0].text.trim();
  // Strip markdown code fences if Claude wrapped it
  return html.replace(/^```html\s*/i, '').replace(/\s*```$/, '');
}

// ── Telegram Delivery ──────────────────────────────────────────────────────────
async function sendKPITelegram({ vercel, mongo, linkedin, weekLabel }) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) { log('[kpi] Telegram: token/chatId manquant — skip'); return; }

  const v = vercel  || {};
  const m = mongo   || {};
  const l = linkedin || {};

  const num = (n) => n != null ? Number(n).toLocaleString('fr-FR') : '—';
  const text = [
    `📊 Rapport KPI — semaine du ${weekLabel}`,
    ``,
    `👁 Visiteurs : ${num(v.visitors)}`,
    `📄 Pages vues : ${num(v.pageviews)}`,
    `💼 Offres actives : ${num(m.activeJobs)} (dont ${num(m.directJobs)} directes)`,
    `👤 Candidats pool : ${num(m.candidates)}`,
    `📬 Candidatures : ${num(m.applications)}`,
    `🔗 LinkedIn abonnés : ${num(l.combined_followers || l.followers_page)}`,
    ``,
    `📧 Rapport complet → ${ADMIN_EMAIL}`,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    const err = await res.text();
    log(`[kpi] Telegram: erreur ${res.status} — ${err.slice(0, 120)}`);
  } else {
    log('[kpi] Telegram: résumé KPI envoyé');
  }
}

// ── Email Delivery ─────────────────────────────────────────────────────────────
async function sendKPIEmail(html, { visitors, weekLabel }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    log('[kpi] Email: GMAIL_USER ou GMAIL_APP_PASSWORD manquant — skip');
    return;
  }
  const transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const visitorsLabel = visitors ? `${visitors.toLocaleString('fr-FR')} visiteurs` : 'rapport hebdo';
  const subject       = `📊 InteractJob KPI — Semaine du ${weekLabel} | ${visitorsLabel}`;
  const to            = ADMIN_EMAIL;
  const cc            = CC_EMAIL !== ADMIN_EMAIL ? CC_EMAIL : undefined;

  await transporter.sendMail({
    from: `"InteractJob Analytics" <${process.env.GMAIL_USER}>`,
    to,
    cc,
    subject,
    html,
  });

  log(`[kpi] Email envoyé → ${to}${cc ? ` (cc: ${cc})` : ''}`);
}

// ── Main exported function ─────────────────────────────────────────────────────
export async function runKPIReporter() {
  log('[kpi] ═══ Démarrage rapport KPI hebdomadaire ═══');

  const weekLabel = isoDate(daysAgo(7));

  // Collect all sources in parallel — each fails gracefully
  const [vercel, gsc, mongo, linkedin] = await Promise.all([
    fetchGA4FromSnapshots().catch((e) => { log(`[kpi] GA4 snapshots fatal: ${e.message}`); return null; }),
    fetchSearchConsole().catch((e)    => { log(`[kpi] GSC fatal: ${e.message}`);    return null; }),
    fetchMongoStats().catch((e)       => { log(`[kpi] Mongo fatal: ${e.message}`);  return null; }),
    fetchLinkedInStats().catch((e)    => { log(`[kpi] LI fatal: ${e.message}`);     return null; }),
  ]);

  log(`[kpi] Sources — GA4:${vercel ? '✅' : '❌'} GSC:${gsc ? '✅' : '❌'} Mongo:${mongo ? '✅' : '❌'} LinkedIn:${linkedin ? '✅' : '❌'}`);

  const objectives = buildObjectivesStatus({ vercel, mongo, linkedin });
  const forecast   = buildForecast(vercel);

  log('[kpi] Génération rapport via Claude Haiku...');
  let html;
  try {
    html = await generateReport({ vercel, gsc, mongo, linkedin, objectives, forecast, weekLabel });
  } catch (err) {
    log(`[kpi] ❌ Claude error: ${err.message}`);
    throw err;
  }

  log('[kpi] Envoi email + Telegram...');
  await Promise.all([
    sendKPIEmail(html, { visitors: vercel?.visitors, weekLabel }),
    sendKPITelegram({ vercel, mongo, linkedin, weekLabel }),
  ]);

  log('[kpi] ✅ Rapport KPI envoyé avec succès');
}
