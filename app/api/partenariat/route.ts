import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company, contactName, email, phone, companySize, needs, message, budget } = body;

    if (!company || !contactName || !email || !needs) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.GMAIL_USER || process.env.SMTP_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"InteractJob" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`,
      to: process.env.GMAIL_USER || process.env.SMTP_USER,
      replyTo: email,
      subject: `[Partenariat Entreprise] ${company} — ${contactName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h2 style="color:#0A2D6E;margin-bottom:4px;">Nouvelle demande de partenariat</h2>
          <p style="color:#6b7280;margin-top:0;">Reçue via interactjob.ma</p>

          <table style="width:100%;border-collapse:collapse;margin-top:20px;">
            <tr style="background:#f9fafb;"><td style="padding:10px 14px;font-weight:600;color:#374151;width:40%;">Entreprise</td><td style="padding:10px 14px;">${company}</td></tr>
            <tr><td style="padding:10px 14px;font-weight:600;color:#374151;">Contact</td><td style="padding:10px 14px;">${contactName}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:10px 14px;font-weight:600;color:#374151;">Email</td><td style="padding:10px 14px;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:10px 14px;font-weight:600;color:#374151;">Téléphone</td><td style="padding:10px 14px;">${phone || "—"}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:10px 14px;font-weight:600;color:#374151;">Taille entreprise</td><td style="padding:10px 14px;">${companySize || "—"}</td></tr>
            <tr><td style="padding:10px 14px;font-weight:600;color:#374151;">Besoins</td><td style="padding:10px 14px;">${needs}</td></tr>
            <tr style="background:#f9fafb;"><td style="padding:10px 14px;font-weight:600;color:#374151;">Budget indicatif</td><td style="padding:10px 14px;">${budget || "—"}</td></tr>
          </table>

          ${message ? `<div style="margin-top:20px;background:#f9fafb;border-radius:8px;padding:16px;"><p style="font-weight:600;color:#374151;margin:0 0 8px;">Message :</p><p style="color:#4b5563;white-space:pre-wrap;margin:0;">${message}</p></div>` : ""}

          <p style="margin-top:24px;color:#9ca3af;font-size:12px;">Envoyé depuis interactjob.ma · ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("partenariat POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
