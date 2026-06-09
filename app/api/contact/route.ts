import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const ADMIN_EMAIL = "contact@interactjob.ma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: "Message trop court" }, { status: 400 });
    }

    const user = process.env.GMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    if (!pass) {
      console.log(`[Contact DRY RUN] ${name} <${email}> — ${subject}\n${message.slice(0, 300)}`);
      return NextResponse.json({ success: true, message: "Message reçu" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"InteractJob.ma" <${user}>`,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: `[Contact] ${subject || "Message du site"} — ${name}`,
      text: `Nouveau message via le formulaire de contact InteractJob.ma\n\nNom: ${name}\nEmail: ${email}\nSujet: ${subject || "(non précisé)"}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ success: true, message: "Message envoyé" });
  } catch (err) {
    console.error("[contact] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
