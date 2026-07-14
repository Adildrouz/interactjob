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
} from "@/lib/alerts";
import type { AlertFilters } from "@/types/alerts";

/**
 * POST /api/alerts — subscribe to job ("offres") alerts by email.
 * Body: { email, city?, sector?, keyword?, language?, sourcePage? }
 * Stores in the unified "alert_subscribers" collection (upsert by
 * email+alert_type+filters) with confirmed:false, then sends a double
 * opt-in confirmation email — no alert is ever sent until that link is
 * clicked (see /api/alerts/confirm).
 */
export async function POST(req: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  let body: { email?: string; city?: string; sector?: string; keyword?: string; language?: string; sourcePage?: string };
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
    ville: String(body.city || "").trim().slice(0, 60) || undefined,
    secteur: String(body.sector || "").trim().slice(0, 60) || undefined,
    keywords: body.keyword ? [String(body.keyword).trim().slice(0, 100)] : [],
  };
  const language = (body.language === "ar" || body.language === "en") ? body.language : "fr";
  const sourcePage = String(body.sourcePage || "offres").slice(0, 80);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db("interactjob").collection(ALERT_SUBSCRIBERS_COLLECTION);

    const matchQuery = {
      email,
      alert_type: "offres",
      "filters.ville": filters.ville ?? null,
      "filters.secteur": filters.secteur ?? null,
      "filters.keywords": filters.keywords,
    };

    const token = generateConfirmToken();
    await col.updateOne(
      matchQuery,
      {
        $setOnInsert: {
          email,
          alert_type: "offres",
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
      const criteria = describeFilters("offres", filters);
      const { subject, text, html } = buildConfirmationEmail({
        alertType: "offres",
        criteria,
        confirmUrl: confirmUrl(email, effectiveToken),
        unsubscribeUrl: unsubscribeUrl(email),
      });
      sendEmail({ to: email, subject, text, html }).catch((e) => console.error("alerts: confirmation email failed:", e));
    }

    return NextResponse.json({ ok: true, alreadyConfirmed });
  } finally {
    await client.close();
  }
}
