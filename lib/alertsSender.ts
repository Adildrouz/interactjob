import { Db, ObjectId } from "mongodb";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { sendEmail } from "@/lib/mailer";
import { describeFilters, ALERT_SUBSCRIBERS_COLLECTION, ALERT_EMAIL_LOGS_COLLECTION } from "@/lib/alerts";
import type { AlertType, AlertFilters } from "@/types/alerts";

/**
 * TS port of agent/alerts-sender.js's matching + digest logic, for the admin
 * "Envoyer une alerte maintenant" button — runs inline in a Vercel function
 * instead of depending on the separate Railway cron process. Keep matching
 * behavior identical to the .js version; the two are duplicated deliberately
 * (different runtimes/module systems) rather than sharing a single file.
 */

const SITE_URL = "https://www.interactjob.ma";
const MAX_ITEMS_PER_EMAIL = 8;
const NAVY = "#00347A";
const TURQUOISE = "#00C2CB";

interface JobItem { title: string; company: string; city?: string; sector?: string; contractType?: string; salary?: string; slug?: string; id?: string; expired?: boolean; postedAt?: string; date_posted?: string; }
interface ConcoursItem { title_fr: string; organization_fr: string; slug: string; datePosted?: string; }
interface RemoteItem { title: string; company: string; category?: string; id?: string; published?: string; }

// Rows are read straight from JSON with no runtime validation — a single
// loose shape lets one TypeConfig type serve all three item kinds without
// fighting parameter-variance on the per-type accessor functions.
type JsonRow = JobItem & ConcoursItem & RemoteItem;

interface TypeConfig {
  file: string;
  dateField: (item: JsonRow) => string | undefined;
  matches: (item: JsonRow, filters: AlertFilters) => boolean;
  itemLabel: (item: JsonRow) => string;
  itemHtml: (item: JsonRow) => string;
  itemUrl: (item: JsonRow) => string;
  itemId: (item: JsonRow) => string;
  listUrl: string;
  listLabel: string;
}

function matchesOffre(job: JsonRow, filters: AlertFilters): boolean {
  if (job.expired) return false;
  if (filters.ville && job.city !== filters.ville) return false;
  if (filters.secteur && job.sector !== filters.secteur) return false;
  if (filters.keywords?.length) {
    const haystack = `${job.title} ${job.company}`.toLowerCase();
    if (!filters.keywords.some((kw) => haystack.includes(kw.toLowerCase()))) return false;
  }
  return true;
}

function matchesConcours(c: JsonRow, filters: AlertFilters): boolean {
  if (filters.secteur) {
    const haystack = `${c.title_fr} ${c.organization_fr}`.toLowerCase();
    if (!haystack.includes(filters.secteur.toLowerCase())) return false;
  }
  return true;
}

function matchesRemote(job: JsonRow, filters: AlertFilters): boolean {
  if (filters.keywords?.length) {
    const haystack = `${job.title} ${job.company} ${job.category || ""}`.toLowerCase();
    if (!filters.keywords.some((kw) => haystack.includes(kw.toLowerCase()))) return false;
  }
  return true;
}

const ALERT_TYPES: Record<AlertType, TypeConfig> = {
  offres: {
    file: "jobs.json",
    dateField: (j) => j.postedAt || j.date_posted,
    matches: matchesOffre,
    itemLabel: (j) => `${j.title}\n  ${j.company} · ${j.city} · ${j.contractType}${j.salary ? ` — 💰 ${j.salary}` : ""}`,
    itemHtml: (j) => `<strong>${j.title}</strong><br><span style="color:#6B7280;">${j.company} · ${j.city} · ${j.contractType}${j.salary ? ` — 💰 ${j.salary}` : ""}</span>`,
    itemUrl: (j) => `/offres/${j.slug || j.id}`,
    itemId: (j) => j.slug || j.id || "",
    listUrl: "/offres",
    listLabel: "Voir toutes les offres",
  },
  concours: {
    file: "concours.json",
    dateField: (c) => c.datePosted,
    matches: matchesConcours,
    itemLabel: (c) => `${c.title_fr}\n  ${c.organization_fr}`,
    itemHtml: (c) => `<strong>${c.title_fr}</strong><br><span style="color:#6B7280;">${c.organization_fr}</span>`,
    itemUrl: (c) => `/concours/${c.slug}`,
    itemId: (c) => c.slug,
    listUrl: "/concours",
    listLabel: "Voir tous les concours",
  },
  remote: {
    file: "remote-jobs.json",
    dateField: (j) => j.published,
    matches: matchesRemote,
    itemLabel: (j) => `${j.title}\n  ${j.company}`,
    itemHtml: (j) => `<strong>${j.title}</strong><br><span style="color:#6B7280;">${j.company}</span>`,
    itemUrl: (j) => `/offres/remote/${j.id}`,
    itemId: (j) => j.id || "",
    listUrl: "/offres/remote",
    listLabel: "Voir toutes les offres remote",
  },
};

function trackClickUrl(subscriberId: string, relativeUrl: string): string {
  return `${SITE_URL}/api/alerts/track-click?sid=${subscriberId}&url=${encodeURIComponent(relativeUrl)}`;
}

function buildDigest(subscriber: { _id: ObjectId; email: string; alert_type: AlertType; filters?: AlertFilters }, typeConfig: TypeConfig, items: JsonRow[]) {
  const criteria = describeFilters(subscriber.alert_type, subscriber.filters || {});
  const sid = subscriber._id.toString();
  const n = items.length;

  const textLines = items.slice(0, MAX_ITEMS_PER_EMAIL)
    .map((item) => `• ${typeConfig.itemLabel(item)}\n  👉 ${SITE_URL}${typeConfig.itemUrl(item)}`)
    .join("\n\n");
  const more = n > MAX_ITEMS_PER_EMAIL ? `\n\n… et ${n - MAX_ITEMS_PER_EMAIL} autre(s) : ${SITE_URL}${typeConfig.listUrl}` : "";
  const unsubUrl = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;

  const text = `Bonjour,

${n} nouvelle${n > 1 ? "s" : ""} correspondance${n > 1 ? "s" : ""} pour votre alerte (${criteria}) :

${textLines}${more}

──────────────────────────────
${typeConfig.listLabel} : ${SITE_URL}${typeConfig.listUrl}

L'équipe InteractJob.ma
Se désinscrire : ${unsubUrl}`;

  const itemsHtml = items.slice(0, MAX_ITEMS_PER_EMAIL).map((item) => `
    <tr><td style="padding:14px 0;border-bottom:1px solid #EEF2F7;">
      <p style="margin:0;font-size:14px;color:#1F2937;">${typeConfig.itemHtml(item)}</p>
      <a href="${trackClickUrl(sid, typeConfig.itemUrl(item))}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:${TURQUOISE};text-decoration:none;">Voir l'offre →</a>
    </td></tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#F0F8FF;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
    <div style="background:${NAVY};border-radius:16px 16px 0 0;padding:24px 28px;text-align:center;">
      <span style="color:#fff;font-size:20px;font-weight:800;">InteractJob<span style="color:${TURQUOISE};">.ma</span></span>
    </div>
    <div style="background:#fff;border:1px solid #D0E4F0;border-top:none;border-radius:0 0 16px 16px;padding:28px;">
      <p style="font-size:15px;color:#1F2937;margin:0 0 4px;">Bonjour,</p>
      <p style="font-size:14px;color:#6B7280;margin:0 0 20px;">${n} nouvelle${n > 1 ? "s" : ""} correspondance${n > 1 ? "s" : ""} pour votre alerte (<strong>${criteria}</strong>) :</p>
      <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
      ${n > MAX_ITEMS_PER_EMAIL ? `<p style="font-size:13px;color:#6B7280;margin:16px 0 0;">… et ${n - MAX_ITEMS_PER_EMAIL} autre(s).</p>` : ""}
      <div style="text-align:center;margin:24px 0 0;">
        <a href="${SITE_URL}${typeConfig.listUrl}" style="display:inline-block;background:${TURQUOISE};color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">${typeConfig.listLabel}</a>
      </div>
    </div>
    <p style="text-align:center;color:#9CA3AF;font-size:11px;margin-top:16px;">
      <a href="${unsubUrl}" style="color:#9CA3AF;">Se désinscrire</a> · InteractJob.ma
    </p>
    <img src="${SITE_URL}/api/alerts/track-open?sid=${sid}" width="1" height="1" style="display:none;" alt="" />
  </div>
</body></html>`;

  const subject = `🔔 ${n} nouvelle${n > 1 ? "s" : ""} correspondance${n > 1 ? "s" : ""} — ${criteria}`;
  return { subject, text, html };
}

function looksLikeBounce(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return /550|551|553|no such user|user unknown|does not exist|invalid recipient/.test(msg);
}

async function readJsonSafe<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", file), "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export interface AlertsSenderResult {
  runId: string;
  totalConfirmed: number;
  sent: number;
  failed: number;
  skippedNoMatch: number;
}

export async function runAlertsSenderOnce(db: Db): Promise<AlertsSenderResult> {
  const dataByType: Record<string, JsonRow[]> = {};
  for (const [type, cfg] of Object.entries(ALERT_TYPES)) {
    dataByType[type] = await readJsonSafe(cfg.file);
  }

  const subscribers = db.collection(ALERT_SUBSCRIBERS_COLLECTION);
  const logs = db.collection(ALERT_EMAIL_LOGS_COLLECTION);

  const alerts = await subscribers.find({ confirmed: true, status: "active" }).toArray();
  const runId = crypto.randomUUID();
  let sent = 0, failed = 0, skippedNoMatch = 0;

  for (const subscriber of alerts) {
    const typeConfig = ALERT_TYPES[subscriber.alert_type as AlertType];
    if (!typeConfig) continue;

    const since = subscriber.last_email_sent_at ? new Date(subscriber.last_email_sent_at) : new Date(Date.now() - 24 * 3600 * 1000);
    const pool = dataByType[subscriber.alert_type] || [];
    const matched = pool
      .filter((item) => typeConfig.matches(item, subscriber.filters || {}) && new Date(typeConfig.dateField(item) || 0) > since)
      .sort((a, b) => new Date(typeConfig.dateField(b) || 0).getTime() - new Date(typeConfig.dateField(a) || 0).getTime());

    if (!matched.length) { skippedNoMatch++; continue; }

    const { subject, text, html } = buildDigest(subscriber as unknown as { _id: ObjectId; email: string; alert_type: AlertType; filters?: AlertFilters }, typeConfig, matched);
    const offersIncluded = matched.slice(0, MAX_ITEMS_PER_EMAIL).map(typeConfig.itemId);

    try {
      const { delivered } = await sendEmail({ to: subscriber.email, subject, text, html });
      if (!delivered) {
        failed++;
        await logs.insertOne({ run_id: runId, subscriber_id: subscriber._id, alert_type: subscriber.alert_type, offers_included: offersIncluded, sent_at: new Date(), status: "failed", error_reason: "GMAIL_APP_PASSWORD non configuré (dry run)" });
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      await subscribers.updateOne({ _id: subscriber._id }, { $set: { last_email_sent_at: new Date() }, $inc: { emails_sent_count: 1 } });
      await logs.insertOne({ run_id: runId, subscriber_id: subscriber._id, alert_type: subscriber.alert_type, offers_included: offersIncluded, sent_at: new Date(), status: "sent", error_reason: null });
      sent++;
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      failed++;
      const bounced = looksLikeBounce(err);
      await logs.insertOne({ run_id: runId, subscriber_id: subscriber._id, alert_type: subscriber.alert_type, offers_included: offersIncluded, sent_at: new Date(), status: bounced ? "bounced" : "failed", error_reason: (err instanceof Error ? err.message : String(err)).slice(0, 300) });
      if (bounced) await subscribers.updateOne({ _id: subscriber._id }, { $set: { status: "bounced" } });
    }
  }

  return { runId, totalConfirmed: alerts.length, sent, failed, skippedNoMatch };
}
