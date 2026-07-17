import { NextRequest, NextResponse } from "next/server";
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
import type { AlertFilters } from "@/types/alerts";

/**
 * POST /api/concours-alerts — subscribe to public-sector concours alerts by email.
 * Body: { email, sector?, language?, sourcePage? }
 * Stores in the unified "alert_subscribers" collection (upsert by
 * email+alert_type+filters) with confirmed:false, then sends a double
 * opt-in confirmation email.
 */
export async function POST(req: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  let body: { email?: string; sector?: string; language?: string; sourcePage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const email = String(body.email || "").toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const filters: AlertFilters = {
    secteur: String(body.sector || "").trim().slice(0, 60) || undefined,
  };
  const language = (body.language === "ar" || body.language === "en") ? body.language : "fr";
  const sourcePage = String(body.sourcePage || "concours").slice(0, 80);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db("interactjob").collection(ALERT_SUBSCRIBERS_COLLECTION);

    const matchQuery = {
      email,
      alert_type: "concours",
      "filters.secteur": filters.secteur ?? null,
    };

    const token = generateConfirmToken();
    await col.updateOne(
      matchQuery,
      {
        $setOnInsert: {
          email,
          alert_type: "concours",
          filters,
          language,
          status: "active",
          confirmed: false,
          confirm_token: token,
          source_page: sourcePage,
          created_at: new Date(),
          emails_sent_count: 0,
        },
      },
      { upsert: true }
    );

    const doc = await col.findOne(matchQuery);
    const effectiveToken = doc?.confirm_token || token;
    const alreadyConfirmed = doc?.confirmed === true;

    if (!alreadyConfirmed) {
      const criteria = describeFilters("concours", filters);
      const { subject, text, html } = buildConfirmationEmail({
        alertType: "concours",
        criteria,
        confirmUrl: confirmUrl(email, effectiveToken),
        unsubscribeUrl: unsubscribeUrl(email),
      });
      try {
        const { delivered } = await sendEmail({ to: email, subject, text, html });
        if (!delivered) console.warn("concours-alerts: confirmation email not delivered (GMAIL_APP_PASSWORD not configured — dry run)");
        await logAlertEmail(client.db("interactjob"), {
          subscriberId: doc?._id ?? null,
          email,
          alertType: "concours",
          emailType: "confirmation",
          status: delivered ? "sent" : "failed",
          errorReason: delivered ? null : "GMAIL_APP_PASSWORD non configuré (dry run)",
        });
      } catch (e) {
        console.error("concours-alerts: confirmation email failed:", e);
        await logAlertEmail(client.db("interactjob"), {
          subscriberId: doc?._id ?? null,
          email,
          alertType: "concours",
          emailType: "confirmation",
          status: "failed",
          errorReason: e instanceof Error ? e.message.slice(0, 300) : "unknown error",
        });
      }
    }

    return NextResponse.json({ ok: true, alreadyConfirmed });
  } finally {
    await client.close();
  }
}
