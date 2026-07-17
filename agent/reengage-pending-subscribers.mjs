/**
 * One-time re-engagement send for subscribers stuck pending confirmation
 * because their original confirmation email never reached them — mainly the
 * `migration_legacy` batch (bulk-imported from the old job_alerts/
 * concours_alerts collections without ever emailing them) plus anyone else
 * still pending after the Railway SMTP IPv6 fix (agent/mailer.js `family: 4`).
 *
 * Sends the honest "a technical problem prevented delivery, it's fixed now"
 * copy — distinct from both the normal confirmation email (buildConfirmationEmail
 * in lib/alerts.ts) and the migration script's "we're upgrading" copy
 * (buildReconfirmEmail in migrate-alert-subscribers.mjs) — this is a one-time
 * trust-recovery message, not the standard flow.
 *
 * Safety: dry run by default, no writes, no emails.
 *   node reengage-pending-subscribers.mjs                 → dry run, lists who would receive it
 *   node reengage-pending-subscribers.mjs --commit         → actually sends + logs to alert_email_logs
 *
 * Scope: confirmed:false, status:'active', source_page:'migration_legacy'
 * only — recent live signups (<3 days old, any other source_page) already
 * got a correctly-working confirmation email through the normal flow and
 * don't need this message; sending it to them would be confusing (nothing
 * was wrong with their email).
 */
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { sendEmail } from './mailer.js';
import { log } from './logger.js';

const COMMIT = process.argv.includes('--commit');

const SITE_URL = 'https://www.interactjob.ma';
const SUBSCRIBERS_COLLECTION = 'alert_subscribers';
const LOGS_COLLECTION = 'alert_email_logs';
const NAVY = '#00347A';
const TURQUOISE = '#00C2CB';

function generateConfirmToken() {
  return crypto.randomBytes(24).toString('hex');
}

function buildReengagementEmail(confirmUrl) {
  const subject = 'Confirmez vos alertes emploi InteractJob';
  const text = `Bonjour,

Vous vous êtes inscrit(e) aux alertes emploi InteractJob.ma.
Un problème technique nous a empêchés de vous envoyer vos alertes
jusqu'ici — c'est maintenant corrigé.

Confirmez votre inscription pour commencer à recevoir les nouvelles
offres qui vous correspondent :
👉 ${confirmUrl}

Si vous ne souhaitez plus recevoir ces alertes, ignorez simplement
cet email.

L'équipe InteractJob.ma`;
  const html = `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#F0F8FF;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:${NAVY};border-radius:16px 16px 0 0;padding:24px 28px;text-align:center;">
      <span style="color:#fff;font-size:20px;font-weight:800;">InteractJob<span style="color:${TURQUOISE};">.ma</span></span>
    </div>
    <div style="background:#fff;border:1px solid #D0E4F0;border-top:none;border-radius:0 0 16px 16px;padding:28px;">
      <p style="font-size:15px;color:#1F2937;margin:0 0 16px;">Bonjour,</p>
      <p style="font-size:15px;color:#1F2937;line-height:1.6;margin:0 0 16px;">
        Vous vous êtes inscrit(e) aux alertes emploi InteractJob.ma. Un problème technique
        nous a empêchés de vous envoyer vos alertes jusqu'ici — c'est maintenant corrigé.
      </p>
      <p style="font-size:15px;color:#1F2937;line-height:1.6;margin:0 0 24px;">
        Confirmez votre inscription pour commencer à recevoir les nouvelles offres qui vous correspondent :
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${confirmUrl}" style="display:inline-block;background:${TURQUOISE};color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px;text-decoration:none;">
          ✅ Confirmer mon inscription
        </a>
      </div>
      <p style="font-size:12px;color:#9CA3AF;line-height:1.5;margin:0;">
        Si vous ne souhaitez plus recevoir ces alertes, ignorez simplement cet email.
      </p>
    </div>
  </div>
</body></html>`;
  return { subject, text, html };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('interactjob');

  try {
    const subscribers = db.collection(SUBSCRIBERS_COLLECTION);
    const logs = db.collection(LOGS_COLLECTION);

    const allPending = await subscribers.find({
      confirmed: false,
      status: 'active',
      source_page: 'migration_legacy',
    }).toArray();

    // Resumable: skip anyone already successfully emailed by a prior
    // (possibly interrupted) run of this script — checked by subscriber_id
    // against alert_email_logs, not by re-querying a --commit flag alone.
    const alreadySent = new Set(
      (await logs.find({ email_type: 'reconfirmation', status: 'sent' }).project({ subscriber_id: 1 }).toArray())
        .map((l) => String(l.subscriber_id))
    );
    const target = allPending.filter((s) => !alreadySent.has(String(s._id)));

    log(`Re-engagement: ${allPending.length} migration_legacy subscriber(s) still pending confirmation, ${target.length} not yet successfully emailed.`);
    if (!COMMIT) {
      log('Dry run only — nothing sent. Re-run with --commit to send.');
      for (const s of target) log(`  would send → ${s.email} (${s.alert_type}, pending since ${s.created_at})`);
      return;
    }

    let sent = 0, failed = 0;
    for (const sub of target) {
      const token = sub.confirm_token || generateConfirmToken();
      if (!sub.confirm_token) {
        await subscribers.updateOne({ _id: sub._id }, { $set: { confirm_token: token } });
      }
      const confirmUrl = `${SITE_URL}/api/alerts/confirm?email=${encodeURIComponent(sub.email)}&token=${token}`;
      const { subject, text, html } = buildReengagementEmail(confirmUrl);

      let delivered = false;
      let errorReason = null;
      try {
        ({ delivered } = await sendEmail({ to: sub.email, subject, text, html }));
        if (delivered) sent++;
        else { failed++; errorReason = 'GMAIL_APP_PASSWORD non configuré (dry run)'; }
      } catch (err) {
        failed++;
        errorReason = err.message?.slice(0, 300) || 'unknown error';
      }

      await logs.insertOne({
        run_id: null,
        subscriber_id: sub._id,
        email: sub.email,
        alert_type: sub.alert_type,
        email_type: 'reconfirmation',
        offers_included: [],
        sent_at: new Date(),
        status: delivered ? 'sent' : 'failed',
        error_reason: errorReason,
      });

      // Same pacing as the digest sender — stay under Gmail rate limits.
      await new Promise((r) => setTimeout(r, 1500));
    }

    log(`Re-engagement: ✓ terminé — ${sent} envoyé(s), ${failed} échec(s) sur ${target.length} au total.`);
  } finally {
    await client.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
