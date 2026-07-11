/**
 * Backfill tool_events from data sources that genuinely predate the funnel
 * tracking deploy (2026-07-11). Only imports what actually exists — never
 * estimates or invents a funnel step that was never recorded.
 *
 * Sources:
 *   - page_views collection        → page_view events (per tool page, per day)
 *   - cvcheckusages collection     → analysis_completed events (CV Checker)
 *   - personality_assessments      → test_completed events (paid personality product)
 *
 * Deliberately NOT backfilled (confirmed to not exist anywhere):
 *   - upload_started/failed, checkout_started, form_abandoned, question_answered — never tracked pre-deploy
 *   - CV Builder payment_completed / cv_downloaded — no DB persistence exists for either
 *   - personality payment_completed — personality_assessments has isPremium:true count = 0 (genuine zero, not a gap)
 *   - the 4 free typology tests' test_completed — no DB persistence exists (client-side only)
 *
 * Every inserted document is flagged metadata.backfilled = true so the
 * dashboard can visually distinguish it from live-tracked events.
 *
 * Usage:
 *   node scripts/backfill-tool-events.mjs           # dry run — prints counts only
 *   node scripts/backfill-tool-events.mjs --commit   # actually writes to MongoDB
 */
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Minimal .env.local loader — the `dotenv` package isn't a dependency of
// this repo, so parse the one line we need directly instead of adding one.
function loadEnvVar(name) {
  if (process.env[name]) return process.env[name];
  try {
    const content = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8');
    const match = content.match(new RegExp(`^${name}=(.*)$`, 'm'));
    return match ? match[1].trim() : undefined;
  } catch {
    return undefined;
  }
}

const COMMIT = process.argv.includes('--commit');
const MONGODB_URI = loadEnvVar('MONGODB_URI');
const DB_NAME = 'interactjob';

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

function synthSessionId(prefix, i) {
  return `${prefix}_${i}_${Math.random().toString(36).slice(2, 10)}`;
}

// ── URL → { tool, test_type } mapping for page_views backfill ────────────────
function classifyUrl(url) {
  // Strip locale prefix (/en, /ar) — pages are locale-agnostic for our funnels
  const stripped = url.replace(/^\/(en|ar)(?=\/|$)/, '');

  if (/^\/cv-checker\*?$/.test(stripped)) return { tool: 'cv_checker', test_type: null };
  if (/^\/generateur-cv$/.test(stripped)) return { tool: 'cv_builder', test_type: null };

  if (stripped === '/test-personnalite') return { tool: 'personality_test', test_type: null };
  if (stripped === '/test-personnalite/mbti') return { tool: 'personality_test', test_type: 'mbti' };
  if (stripped === '/test-personnalite/disc') return { tool: 'personality_test', test_type: 'disc' };
  if (stripped === '/test-personnalite/couleurs') return { tool: 'personality_test', test_type: 'couleurs' };
  if (stripped === '/test-personnalite/enneagramme') return { tool: 'personality_test', test_type: 'enneagramme' };
  if (stripped === '/test-personnalite/professionnel') return { tool: 'personality_test', test_type: 'professionnel' };

  if (stripped.startsWith('/personality')) return { tool: 'personality_test', test_type: 'professionnel' };

  return null;
}

async function buildPageViewEvents(db) {
  const docs = await db.collection('page_views').find({
    url: { $regex: 'cv-checker|generateur-cv|test-personnalite|personality' },
  }).toArray();

  const events = [];
  const skipped = new Set();

  for (const doc of docs) {
    const cls = classifyUrl(doc.url);
    if (!cls) { skipped.add(doc.url); continue; }

    const createdAt = new Date(`${doc.date}T12:00:00.000Z`);
    const count = Math.max(1, doc.count || 1);
    for (let i = 0; i < count; i++) {
      events.push({
        session_id: synthSessionId('bf_pv', i),
        tool: cls.tool,
        test_type: cls.test_type,
        event: 'page_view',
        metadata: { backfilled: true, source: 'page_views', url: doc.url },
        country: null,
        currency: null,
        referrer: null,
        created_at: createdAt,
      });
    }
  }

  if (skipped.size > 0) {
    console.log(`   (ignored ${skipped.size} matched-but-unclassified url(s): ${[...skipped].join(', ')})`);
  }

  return events;
}

async function buildCvCheckerEvents(db) {
  const docs = await db.collection('cvcheckusages').find({}).toArray();
  return docs.map((doc, i) => ({
    session_id: synthSessionId('bf_cv', i),
    tool: 'cv_checker',
    test_type: null,
    event: 'analysis_completed',
    metadata: {
      backfilled: true,
      source: 'cvcheckusages',
      score: doc.score,
      maxScore: doc.maxScore,
      pct: doc.pct,
      wordCount: doc.wordCount,
      locale: doc.locale,
    },
    country: null,
    currency: null,
    referrer: null,
    created_at: doc.checkedAt ? new Date(doc.checkedAt) : new Date(),
  }));
}

async function buildPersonalityEvents(db) {
  const docs = await db.collection('personality_assessments').find({}).toArray();
  const completed = docs.map((doc) => ({
    session_id: doc.sessionId || synthSessionId('bf_pers', doc._id),
    tool: 'personality_test',
    test_type: 'professionnel',
    event: 'test_completed',
    metadata: { backfilled: true, source: 'personality_assessments' },
    country: null,
    currency: null,
    referrer: null,
    created_at: doc.createdAt ? new Date(doc.createdAt) : new Date(),
  }));

  // Genuinely check for premium payments — do NOT assume zero, verify each time.
  const paid = docs.filter((d) => d.isPremium === true && d.paymentId);
  const payments = paid.map((doc) => ({
    session_id: doc.sessionId || synthSessionId('bf_pers_pay', doc._id),
    tool: 'personality_test',
    test_type: 'professionnel',
    event: 'payment_completed',
    metadata: { backfilled: true, source: 'personality_assessments', paymentId: doc.paymentId },
    country: null,
    currency: null,
    referrer: null,
    created_at: doc.updatedAt ? new Date(doc.updatedAt) : (doc.createdAt ? new Date(doc.createdAt) : new Date()),
  }));

  return { completed, payments, paidCount: paid.length, totalCount: docs.length };
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  console.log(`\n=== Backfill tool_events — ${COMMIT ? 'COMMIT MODE (will write)' : 'DRY RUN (no writes)'} ===\n`);

  const pageViewEvents = await buildPageViewEvents(db);
  const cvCheckerEvents = await buildCvCheckerEvents(db);
  const { completed: personalityCompleted, payments: personalityPayments, paidCount, totalCount } = await buildPersonalityEvents(db);

  const byTool = { cv_checker: 0, cv_builder: 0, personality_test: 0 };
  for (const e of pageViewEvents) byTool[e.tool]++;

  console.log('📄 page_view (from page_views collection):');
  console.log(`   cv_checker: ${pageViewEvents.filter((e) => e.tool === 'cv_checker').length}`);
  console.log(`   cv_builder: ${pageViewEvents.filter((e) => e.tool === 'cv_builder').length}`);
  console.log(`   personality_test: ${pageViewEvents.filter((e) => e.tool === 'personality_test').length}`);

  console.log(`\n✅ analysis_completed (from cvcheckusages): ${cvCheckerEvents.length}`);

  console.log(`\n🧠 personality_assessments: ${totalCount} total records, ${paidCount} with isPremium:true`);
  console.log(`   test_completed to import: ${personalityCompleted.length}`);
  console.log(`   payment_completed to import: ${personalityPayments.length}${paidCount === 0 ? '  (genuine zero — nobody has ever paid, not a gap)' : ''}`);

  console.log('\n⛔ Confirmed NOT backfilled (no real source exists):');
  console.log('   - cv_builder: payment_completed, payment_attempted, payment_failed, cv_downloaded, checkout_started, builder_started, preview_generated, form_step_completed, form_abandoned');
  console.log('   - cv_checker: upload_started, upload_failed, upload_success, report_viewed, cta_clicked');
  console.log('   - personality_test: test_started, question_answered, test_abandoned, result_viewed, paid_report_cta_clicked, result_shared, job_match_clicked, checkout_started, payment_attempted, payment_failed');
  console.log('   - the 4 free typology tests (mbti/disc/couleurs/enneagramme): test_completed (no DB persistence exists client-side)');

  const allEvents = [...pageViewEvents, ...cvCheckerEvents, ...personalityCompleted, ...personalityPayments];
  console.log(`\n📦 Total events to insert: ${allEvents.length}`);

  if (!COMMIT) {
    console.log('\nDry run only — no writes performed. Re-run with --commit to write these to MongoDB.');
    await client.close();
    return;
  }

  const col = db.collection('toolevents');
  const deleted = await col.deleteMany({ 'metadata.backfilled': true });
  console.log(`\n🗑️  Cleared ${deleted.deletedCount} previously-backfilled event(s) (idempotent re-run)`);

  if (allEvents.length > 0) {
    const res = await col.insertMany(allEvents);
    console.log(`✅ Inserted ${res.insertedCount} backfilled event(s) into tool_events`);
  }

  await client.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
