/**
 * Shared email utility — Gmail SMTP via nodemailer.
 * If GMAIL_APP_PASSWORD is not set, logs the content instead of sending (safe for testing).
 */

import nodemailer from 'nodemailer';
import dns from 'dns';
import { log } from './logger.js';

const SMTP_HOST = 'smtp.gmail.com';

// Railway's container reports no local IPv4 network interface to Node
// (os.networkInterfaces() — likely an IPv6-only pod network with IPv4
// handled by external NAT, invisible to the container's own interface
// list). Nodemailer's built-in resolver (lib/shared/index.js:
// isFamilySupported) checks exactly this before even attempting an IPv4
// DNS lookup, so on Railway it always skips straight to IPv6 — which
// then fails to connect (ENETUNREACH, confirmed in alert_email_logs on
// every digest attempt). dns.setDefaultResultOrder('ipv4first') does NOT
// help here: nodemailer resolves via its own dns.resolve4()/resolve6()
// wrapper, never Node's global dns.lookup() default-order setting.
// Fix: resolve the IPv4 address ourselves (real DNS resolution, not
// nodemailer's interface pre-check) and connect to that literal IP,
// with `servername` set for correct TLS SNI/certificate validation
// against the hostname. Falls back to the hostname if resolution fails
// for any reason, rather than throwing.
async function resolveSmtpIPv4Host() {
  try {
    const addresses = await dns.promises.resolve4(SMTP_HOST);
    return addresses[0] || SMTP_HOST;
  } catch (err) {
    log(`Mailer: dns.resolve4(${SMTP_HOST}) failed, falling back to hostname — ${err.message}`);
    return SMTP_HOST;
  }
}

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

  const smtpHost = await resolveSmtpIPv4Host();
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: { servername: SMTP_HOST },
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
