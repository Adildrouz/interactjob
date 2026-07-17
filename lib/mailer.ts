import nodemailer from "nodemailer";
import dns from "dns";

// Railway's container network can't route the IPv6 address Node resolves
// for smtp.gmail.com (ENETUNREACH / connection timeout on every send) —
// prefer IPv4, which is always reachable. Vercel hasn't shown this symptom,
// but this is process-wide and harmless to set defensively here too.
// Idempotent, cheap to call more than once.
dns.setDefaultResultOrder("ipv4first");

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

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user, pass },
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
