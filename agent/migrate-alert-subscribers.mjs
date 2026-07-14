/**
 * One-time migration: legacy "job_alerts" (105 real subscribers, never sent
 * a single email — last_sent_at was never set) and "concours_alerts" (0
 * subscribers) into the unified "alert_subscribers" collection used by the
 * new double opt-in + sending engine.
 *
 * Safety levels, each an explicit opt-in flag (default is the safest):
 *   node migrate-alert-subscribers.mjs                    → dry run, no writes, no emails
 *   node migrate-alert-subscribers.mjs --commit            → writes alert_subscribers rows, sends NO email
 *   node migrate-alert-subscribers.mjs --commit --send-emails → also sends the re-confirmation email (mode=reconfirm only)
 *
 * --mode=reconfirm (default): migrated rows get confirmed:false + a fresh
 *   confirm_token — matches the same double opt-in flow new signups go
 *   through, safest for Loi 09-08 compliance since these people never
 *   explicitly confirmed anything.
 * --mode=grandfather: migrated rows get confirmed:true immediately (no
 *   re-confirmation email needed/sent) — only use this if the product
 *   decision is that the original signup already counts as consent.
 *
 * Idempotent: re-running with --commit skips any legacy doc whose email+
 * alert_type+filters already exists in alert_subscribers (matched the same
 * way the live subscribe routes upsert), so it's safe to re-run.
 */
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { sendEmail } from './mailer.js';
import { log } from './logger.js';

const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const SEND_EMAILS = args.includes('--send-emails');
const modeArg = args.find((a) => a.startsWith('--mode='));
const MODE = modeArg ? modeArg.split('=')[1] : 'reconfirm';

if (!['reconfirm', 'grandfather'].includes(MODE)) {
  console.error(`Unknown --mode=${MODE}, expected "reconfirm" or "grandfather"`);
  process.exit(1);
}
if (SEND_EMAILS && !COMMIT) {
  console.error('--send-emails requires --commit');
  process.exit(1);
}
if (SEND_EMAILS && MODE !== 'reconfirm') {
  console.error('--send-emails only applies to --mode=reconfirm (grandfathered rows need no confirmation email)');
  process.exit(1);
}

const SITE_URL = 'https://www.interactjob.ma';
const SUBSCRIBERS_COLLECTION = 'alert_subscribers';

function generateConfirmToken() {
  return crypto.randomBytes(24).toString('hex');
}

function legacyOffreToSubscriber(doc) {
  const filters = {};
  if (doc.city) filters.ville = doc.city;
  if (doc.sector) filters.secteur = doc.sector;
  if (doc.keyword) filters.keywords = [doc.keyword];
  return {
    email: doc.email,
    alert_type: 'offres',
    filters,
    legacyStatus: doc.active === false ? 'unsubscribed' : 'active',
    created_at: doc.created_at || new Date(),
  };
}

function legacyConcoursToSubscriber(doc) {
  const filters = {};
  if (doc.sector) filters.secteur = doc.sector;
  return {
    email: doc.email,
    alert_type: 'concours',
    filters,
    legacyStatus: doc.active === false ? 'unsubscribed' : 'active',
    created_at: doc.created_at || new Date(),
  };
}

function buildReconfirmEmail(alertType, criteria, confirmUrl, unsubscribeUrl) {
  const label = alertType === 'concours' ? 'concours' : 'emploi';
  const subject = `Confirmez votre alerte ${label} — InteractJob.ma`;
  const text = `Bonjour,

Nous mettons à niveau notre système d'alertes ${label} sur InteractJob.ma.

Pour continuer à recevoir vos alertes (${criteria}), merci de confirmer votre abonnement en cliquant sur ce lien :
👉 ${confirmUrl}

Si vous ne confirmez pas, vous ne recevrez plus d'alertes à partir de maintenant — c'est notre nouvelle politique de consentement.

Si vous ne souhaitez plus recevoir d'alertes, vous pouvez vous désinscrire ici :
${unsubscribeUrl}

L'équipe InteractJob.ma`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
  <div style="background:#00347A;padding:20px;text-align:center;">
    <span style="color:#fff;font-size:18px;font-weight:bold;">InteractJob.ma</span>
  </div>
  <div style="padding:24px;color:#1F2937;">
    <p>Bonjour,</p>
    <p>Nous mettons à niveau notre système d'alertes ${label}. Pour continuer à recevoir vos alertes (<strong>${criteria}</strong>), merci de confirmer votre abonnement :</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${confirmUrl}" style="background:#00C2CB;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Confirmer mon alerte</a>
    </p>
    <p style="color:#6B7280;font-size:13px;">Si vous ne confirmez pas, vous ne recevrez plus d'alertes à partir de maintenant.</p>
    <p style="color:#9CA3AF;font-size:12px;margin-top:24px;"><a href="${unsubscribeUrl}" style="color:#9CA3AF;">Se désinscrire</a></p>
  </div>
</div>`;
  return { subject, text, html };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('interactjob');

  try {
    const [jobAlerts, concoursAlerts] = await Promise.all([
      db.collection('job_alerts').find({}).toArray(),
      db.collection('concours_alerts').find({}).toArray(),
    ]);

    const legacy = [
      ...jobAlerts.map(legacyOffreToSubscriber),
      ...concoursAlerts.map(legacyConcoursToSubscriber),
    ];

    log(`Found ${jobAlerts.length} job_alerts + ${concoursAlerts.length} concours_alerts = ${legacy.length} legacy rows.`);
    log(`Mode: ${MODE}${COMMIT ? ' (COMMIT — will write)' : ' (dry run — no writes)'}${SEND_EMAILS ? ' + sending re-confirmation emails' : ''}`);

    const subscribers = db.collection(SUBSCRIBERS_COLLECTION);
    let toInsert = 0, alreadyMigrated = 0, emailsSent = 0, emailsFailed = 0;

    for (const row of legacy) {
      const matchQuery = { email: row.email, alert_type: row.alert_type };
      if (row.filters.ville) matchQuery['filters.ville'] = row.filters.ville;
      if (row.filters.secteur) matchQuery['filters.secteur'] = row.filters.secteur;
      if (row.filters.keywords) matchQuery['filters.keywords'] = row.filters.keywords;

      const existing = await subscribers.findOne(matchQuery);
      if (existing) { alreadyMigrated++; continue; }
      toInsert++;

      if (!COMMIT) continue;

      const confirmed = MODE === 'grandfather';
      const confirmToken = confirmed ? null : generateConfirmToken();
      const newDoc = {
        email: row.email,
        alert_type: row.alert_type,
        filters: row.filters,
        language: 'fr',
        status: row.legacyStatus,
        confirmed,
        confirm_token: confirmToken,
        source_page: 'migration_legacy',
        created_at: row.created_at,
        confirmed_at: confirmed ? row.created_at : null,
        unsubscribed_at: row.legacyStatus === 'unsubscribed' ? new Date() : null,
        last_email_sent_at: null,
        emails_sent_count: 0,
        last_opened_at: null,
      };
      const { insertedId } = await subscribers.insertOne(newDoc);

      if (SEND_EMAILS && row.legacyStatus === 'active') {
        const criteria = [...(row.filters.keywords || []), row.filters.secteur, row.filters.ville].filter(Boolean).join(' · ')
          || (row.alert_type === 'concours' ? 'Tous les concours' : 'Toutes les offres');
        const confirmUrl = `${SITE_URL}/api/alerts/confirm?email=${encodeURIComponent(row.email)}&token=${confirmToken}`;
        const unsubscribeUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(row.email)}`;
        const { subject, text, html } = buildReconfirmEmail(row.alert_type, criteria, confirmUrl, unsubscribeUrl);
        try {
          await sendEmail({ to: row.email, subject, text, html });
          emailsSent++;
        } catch (err) {
          emailsFailed++;
          log(`Re-confirmation email failed for subscriber ${insertedId}: ${err.message}`);
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    log(`Already migrated (skipped): ${alreadyMigrated}`);
    log(`${COMMIT ? 'Inserted' : 'Would insert'}: ${toInsert}`);
    if (SEND_EMAILS) log(`Re-confirmation emails sent: ${emailsSent}, failed: ${emailsFailed}`);
    if (!COMMIT) log('Dry run only — nothing was written. Re-run with --commit to write.');
  } finally {
    await client.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
