import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
}

export async function sendEmail({ to, subject, text, replyTo, attachments }: EmailOptions): Promise<void> {
  const user = process.env.GMAIL_USER || "jobinteract@gmail.com";
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!pass) {
    console.log(`[Mailer DRY RUN] To: ${to} | Subject: ${subject}`);
    console.log(text.slice(0, 300));
    return;
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
    ...(replyTo ? { replyTo } : {}),
    ...(attachments?.length ? { attachments } : {}),
  });
}
