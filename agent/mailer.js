/**
 * Shared email utility — Gmail SMTP via nodemailer.
 * If GMAIL_APP_PASSWORD is not set, logs the content instead of sending (safe for testing).
 */

import nodemailer from 'nodemailer';
import dns from 'dns';
import { log } from './logger.js';

// Railway's container network can't route the IPv6 address Node resolves
// for smtp.gmail.com (ENETUNREACH / connection timeout on every send —
// confirmed in alert_email_logs, every digest attempt failing this way).
// Prefer IPv4, which is always reachable. Process-wide, idempotent, cheap
// to call more than once.
dns.setDefaultResultOrder('ipv4first');

// delivered:false means the credential is missing and this was a dry-run
// no-op (logged only) — callers that need to know whether an email actually
// went out (alerts-sender.js) must check this instead of assuming a
// resolved promise means delivery.
export async function sendEmail({ to, subject, text, html, replyTo, attachments }) {
  const user = process.env.GMAIL_USER || 'jobinteract@gmail.com';
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!pass) {
    log(`Email [DRY RUN — GMAIL_APP_PASSWORD non d�fini]`);
    log(`Email: À : ${to}`);
    log(`Email: Sujet : ${subject}`);
    log(`Email: Contenu (500 premiers caract�res) :\n${text.slice(0, 500)}`);
    return { delivered: false };
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"InteractJob Agent" <${user}>`,
    to,
    subject,
    text,
    ...(html        ? { html }        : {}),
    ...(replyTo     ? { replyTo }     : {}),
    ...(attachments ? { attachments } : {}),
  });

  log(`Email: ✓ envoy� → ${subject}`);
  return { delivered: true };
}
