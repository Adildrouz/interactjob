import { after, NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EmployerInboundLead } from "@/lib/models/EmployerInboundLead";
import { sendEmail } from "@/lib/mailer";
import { excludedFromRecruiterOutreach } from "@/lib/recruiter-policy";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Demande invalide." }, { status: 400 });
    }
    const { companyName, sector, sectorOther, email, message, locale, website } = body;
    for (const value of [companyName, sector, sectorOther, email, message, locale, website]) {
      if (value != null && typeof value !== "string") return NextResponse.json({ error: "Format invalide." }, { status: 400 });
    }

    // Honeypot: bots fill the hidden "website" field
    if (website) return NextResponse.json({ success: true });
    if ((message || "").length > 30000) {
      return NextResponse.json({ error: "Le descriptif dépasse 30 000 caractères. Envoyez-le à contact@interactjob.ma." }, { status: 400 });
    }

    if (!companyName?.trim() || !email?.trim() || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json(
        { error: "Nom d'entreprise et email valide requis" },
        { status: 400 }
      );
    }

    await connectDB();
    const lead = await EmployerInboundLead.create({
      company_name: companyName.trim().slice(0, 200),
      sector: (sector || "").slice(0, 100),
      sector_other: sector === "Autre" ? (sectorOther || "").trim().slice(0, 200) : "",
      email: email.trim().toLowerCase(),
      message: message || "",
      locale: locale || "fr",
      status: "new",
      created_at: new Date(),
      admin_notification: "pending",
      acknowledgement: "pending",
    });

    after(async () => {
      // The alert contains only a link; contact details stay in the protected admin view.
      const alert = sendEmail({
        to: "contact@interactjob.ma",
        subject: "Nouvelle demande recruteur à traiter — InteractJob",
        text: "Une nouvelle demande a été enregistrée. Consultez-la et assurez son suivi : https://www.interactjob.ma/admin/leads",
      });
      const acknowledge = excludedFromRecruiterOutreach(lead.company_name, lead.email)
        ? Promise.resolve({ delivered: false })
        : sendEmail({
          to: lead.email,
          subject: "Votre demande de recrutement a bien été reçue — InteractJob",
          text: "Bonjour,\n\nVotre demande a bien été enregistrée. Elle attend le traitement de notre équipe ; elle n’est pas encore publiée.\n\nVous pouvez aussi déposer une annonce gratuitement, sans compte, sur https://www.interactjob.ma/publier\n\nSi votre descriptif a déjà été envoyé, il n’est pas nécessaire de le ressaisir : vous pouvez répondre à cet email pour le compléter.\n\nL’équipe InteractJob\ncontact@interactjob.ma",
        });
      const [admin, employer] = await Promise.allSettled([alert, acknowledge]);
      await EmployerInboundLead.updateOne({ _id: lead._id }, { $set: {
        admin_notification: admin.status === "fulfilled" && admin.value.delivered ? "sent" : "failed",
        acknowledgement: excludedFromRecruiterOutreach(lead.company_name, lead.email) ? "skipped"
          : employer.status === "fulfilled" && employer.value.delivered ? "sent" : "failed",
      } }).catch(error => console.error("[recruteurs/lead/notification-state]", error));
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[recruteurs/lead]", err);
    return NextResponse.json({ error: "Erreur serveur, réessayez." }, { status: 500 });
  }
}
