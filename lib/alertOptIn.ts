import { MongoClient } from "mongodb";
import { sendEmail } from "@/lib/mailer";
import {
  ALERT_SUBSCRIBERS_COLLECTION,
  generateConfirmToken,
  describeFilters,
  buildConfirmationEmail,
  confirmUrl,
  unsubscribeUrl,
  logAlertEmail,
} from "@/lib/alerts";
import type { AlertLanguage } from "@/types/alerts";

export type OptInSourcePage = "application_form" | "spontaneous_application";

const CONTEXT_NOTES: Record<OptInSourcePage, string> = {
  application_form: "Vous avez demandé à recevoir les alertes emploi lors de votre candidature sur InteractJob.ma. Confirmez votre inscription ci-dessous.",
  spontaneous_application: "Vous avez demandé à recevoir les alertes emploi lors de votre candidature spontanée sur InteractJob.ma. Confirmez votre inscription ci-dessous.",
};

/**
 * Opt-in from an application form (job-specific or spontaneous) — distinct
 * from the direct alert forms (/api/alerts, /api/concours-alerts) in one
 * important way: matched by {email, alert_type:'offres'} only, ignoring
 * filters, so a candidate applying to several jobs refines one subscription
 * instead of spawning a new one per job (per the mission's explicit dedup
 * rule). Always alert_type "offres" — application forms are job-context,
 * never concours/remote.
 *
 * status stays "active" (never a literal "pending" status value) — the
 * admin dashboard and sender query already treat confirmed:false + status:
 * "active" as the sole "pending confirmation" signal; introducing a 4th
 * status string would silently break every existing aggregate that assumes
 * status is active/unsubscribed/bounced.
 */
export async function subscribeFromApplicationOptIn(opts: {
  email: string;
  secteur?: string;
  ville?: string;
  language?: AlertLanguage;
  sourcePage: OptInSourcePage;
}): Promise<{ alreadyConfirmed: boolean; delivered: boolean }> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  const email = opts.email.toLowerCase().trim();
  const secteur = opts.secteur?.trim().slice(0, 60) || undefined;
  const ville = opts.ville?.trim().slice(0, 60) || undefined;
  const language: AlertLanguage = opts.language === "ar" || opts.language === "en" ? opts.language : "fr";

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db("interactjob").collection(ALERT_SUBSCRIBERS_COLLECTION);

    const existing = await col.findOne({ email, alert_type: "offres" });

    let effectiveToken: string;
    let alreadyConfirmed: boolean;
    let subscriberId: string | null;

    if (existing) {
      alreadyConfirmed = existing.confirmed === true;
      effectiveToken = existing.confirm_token || generateConfirmToken();
      subscriberId = String(existing._id);
      const filterUpdates: Record<string, unknown> = {};
      if (secteur) filterUpdates["filters.secteur"] = secteur;
      if (ville) filterUpdates["filters.ville"] = ville;
      if (!existing.confirm_token) filterUpdates.confirm_token = effectiveToken;
      if (Object.keys(filterUpdates).length > 0) {
        await col.updateOne({ _id: existing._id }, { $set: filterUpdates });
      }
    } else {
      alreadyConfirmed = false;
      effectiveToken = generateConfirmToken();
      const { insertedId } = await col.insertOne({
        email,
        alert_type: "offres",
        filters: { secteur, ville, keywords: [] },
        language,
        status: "active",
        confirmed: false,
        confirm_token: effectiveToken,
        source_page: opts.sourcePage,
        created_at: new Date(),
        emails_sent_count: 0,
      });
      subscriberId = String(insertedId);
    }

    if (alreadyConfirmed) {
      return { alreadyConfirmed: true, delivered: true };
    }

    const criteria = describeFilters("offres", { secteur, ville, keywords: [] });
    const { subject, text, html } = buildConfirmationEmail({
      alertType: "offres",
      criteria,
      confirmUrl: confirmUrl(email, effectiveToken),
      unsubscribeUrl: unsubscribeUrl(email, effectiveToken),
      contextNote: CONTEXT_NOTES[opts.sourcePage],
    });
    let delivered = false;
    let errorReason: string | null = null;
    try {
      ({ delivered } = await sendEmail({ to: email, subject, text, html }));
      if (!delivered) errorReason = "GMAIL_APP_PASSWORD non configuré (dry run)";
    } catch (e) {
      errorReason = e instanceof Error ? e.message.slice(0, 300) : "unknown error";
    }
    await logAlertEmail(client.db("interactjob"), {
      subscriberId,
      email,
      alertType: "offres",
      emailType: "confirmation",
      status: delivered ? "sent" : "failed",
      errorReason,
    });
    return { alreadyConfirmed: false, delivered };
  } finally {
    await client.close();
  }
}
