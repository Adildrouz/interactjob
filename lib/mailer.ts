import nodemailer from "nodemailer";
import dns from "dns";

const SMTP_HOST = "smtp.gmail.com";

// Nodemailer's built-in DNS resolver (node_modules/nodemailer/lib/shared/
// index.js: isFamilySupported) checks the local machine's own network
// interfaces before attempting an IPv4 lookup at all — on Railway that
// check reports no local IPv4 interface (IPv6-only pod network, IPv4
// handled by external NAT), so nodemailer always falls back to IPv6,
// which fails to connect (ENETUNREACH — confirmed in alert_email_logs on
// every agent/mailer.js digest attempt). dns.setDefaultResultOrder does
// NOT help: nodemailer bypasses Node's global dns.lookup() default order
// with its own dns.resolve4()/resolve6() wrapper. Vercel hasn't shown
// this symptom, but resolving IPv4 ourselves here too costs nothing and
// rules it out. Falls back to the hostname if resolution fails.
async function resolveSmtpIPv4Host(): Promise<string> {
  try {
    const addresses = await dns.promises.resolve4(SMTP_HOST);
    return addresses[0] || SMTP_HOST;
  } catch {
    return SMTP_HOST;
  }
}

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

// delivered:false means the credential is missing and the send was a dry-run
// no-op (logged only) — callers that need to know whether an email actually
// went out (alerts confirmation/digest/test-send) must check this instead of
// assuming a resolved promise means delivery.
export async function sendEmail({ to, subject, text, html, replyTo, attachments }: EmailOptions): Promise<{ delivered: boolean }> {
  const user = process.env.GMAIL_USER || "jobinteract@gmail.com";
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!pass) {
    console.log(`[Mailer DRY RUN] To: ${to} | Subject: ${subject}`);
    console.log(text.slice(0, 300));
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
    from: `"InteractJob.ma" <${user}>`,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
    ...(replyTo ? { replyTo } : {}),
    ...(attachments?.length ? { attachments } : {}),
  });
  return { delivered: true };
}
