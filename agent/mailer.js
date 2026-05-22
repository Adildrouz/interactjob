/**
 * Shared email utility â€” Gmail SMTP via nodemailer.
 * If GMAIL_APP_PASSWORD is not set, logs the content instead of sending (safe for testing).
 */

import nodemailer from 'nodemailer';
import { log } from './logger.js';

export async function sendEmail({ to, subject, text }) {
  const user = process.env.GMAIL_USER || 'jobinteract@gmail.com';
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!pass) {
    log(`Email [DRY RUN â€” GMAIL_APP_PASSWORD non défini]`);
    log(`Email: Ã€ : ${to}`);
    log(`Email: Sujet : ${subject}`);
    log(`Email: Contenu (500 premiers caractères) :\n${text.slice(0, 500)}`);
    return;
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
  });

  log(`Email: âœ“ envoyé â†’ ${subject}`);
}
