import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { sendEmail } from "@/lib/mailer";
import { ALERT_SUBSCRIBERS_COLLECTION, describeFilters, buildConfirmationEmail, confirmUrl, unsubscribeUrl, generateConfirmToken, logAlertEmail } from "@/lib/alerts";
import type { AlertType, AlertFilters } from "@/types/alerts";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

// POST /api/admin/alerts/resend-confirmations — resend the double opt-in
// confirmation email to every subscriber still pending (confirmed:false,
// status:active). Real email send to real people — the admin UI must
// confirm() before calling this.
export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");
    const subscribers = db.collection(ALERT_SUBSCRIBERS_COLLECTION);

    const pending = await subscribers.find({ confirmed: false, status: "active" }).toArray();

    let sent = 0, failed = 0, notConfigured = false;
    for (const sub of pending) {
      const token = sub.confirm_token || generateConfirmToken();
      if (!sub.confirm_token) {
        await subscribers.updateOne({ _id: sub._id }, { $set: { confirm_token: token } });
      }
      const criteria = describeFilters(sub.alert_type as AlertType, (sub.filters || {}) as AlertFilters);
      const { subject, text, html } = buildConfirmationEmail({
        alertType: sub.alert_type as AlertType,
        criteria,
        confirmUrl: confirmUrl(sub.email, token),
        unsubscribeUrl: unsubscribeUrl(sub.email, token),
      });
      let delivered = false;
      let errorReason: string | null = null;
      try {
        ({ delivered } = await sendEmail({ to: sub.email, subject, text, html }));
        if (delivered) sent++;
        else { failed++; notConfigured = true; errorReason = "GMAIL_APP_PASSWORD non configuré (dry run)"; }
      } catch (e) {
        failed++;
        errorReason = e instanceof Error ? e.message.slice(0, 300) : "unknown error";
      }
      await logAlertEmail(db, {
        subscriberId: sub._id,
        email: sub.email,
        alertType: sub.alert_type as AlertType,
        emailType: "reconfirmation",
        status: delivered ? "sent" : "failed",
        errorReason,
      });
      await new Promise((r) => setTimeout(r, 1500));
    }

    return NextResponse.json({
      ok: true,
      total: pending.length,
      sent,
      failed,
      ...(notConfigured ? { warning: "GMAIL_APP_PASSWORD n'est pas configuré — les emails n'ont pas réellement été envoyés (dry run)." } : {}),
    });
  } finally {
    await client.close();
  }
}
