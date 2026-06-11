import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { sendEmail } from "@/lib/mailer";

function verifyAuth(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

// ─── Email templates ─────────────────────────────────────────────────────────
const SITE_URL = "https://www.interactjob.ma";
const UNSUBSCRIBE_URL = `${SITE_URL}/api/unsubscribe`;

function emailHeader() {
  return `InteractJob.ma — Plateforme d'emploi #1 au Maroc\n${"─".repeat(60)}\n\n`;
}
function emailFooter(email: string) {
  return `\n\n${"─".repeat(60)}\nInteractJob.ma · contact@interactjob.ma\nPour vous désinscrire : ${UNSUBSCRIBE_URL}?email=${encodeURIComponent(email)}\n`;
}

function buildTemplate(template: string, employer: any): { subject: string; text: string } {
  const company = employer.company_name || "votre entreprise";
  const prenom  = employer.contact_name?.split(" ")[0] || "Responsable RH";

  if (template === "cold") {
    return {
      subject: `${prenom}, publiez votre offre d'emploi sur InteractJob.ma`,
      text: emailHeader() +
`Bonjour ${prenom},

Nous avons remarqué que ${company} recrute activement au Maroc.

InteractJob.ma vous propose de publier votre offre directement sur notre plateforme — des milliers de candidats qualifiés visitent notre site chaque mois.

🌟 Offre Sponsorisée : 990 MAD / 30 jours
✅ Mise en avant homepage + newsletter 8 000 abonnés RH
✅ Badge "Sponsorisée" + position prioritaire dans les résultats
✅ Rapport de performance (vues + candidatures)

👉 Publier maintenant : ${SITE_URL}/publier-offre

Cordialement,
Adil Drouz — Fondateur InteractJob.ma` + emailFooter(employer.email),
    };
  }

  if (template === "followup") {
    return {
      subject: `Votre offre sur InteractJob.ma — encore disponible`,
      text: emailHeader() +
`Bonjour ${prenom},

Je reviens vers vous suite à mon message de la semaine dernière.

Vos recrutements en cours méritent d'être vus par les meilleurs candidats marocains.

Cette semaine, des centaines de candidats ont recherché des postes dans votre secteur sur InteractJob.ma.

🎯 Offre de lancement : 544 MAD (promo valable cette semaine)

👉 Démarrer maintenant : ${SITE_URL}/publier-offre

Cordialement,
Adil Drouz — Fondateur InteractJob.ma` + emailFooter(employer.email),
    };
  }

  if (template === "renewal") {
    const jobTitle = employer.last_job_title || "votre offre";
    return {
      subject: `${company} — votre offre expire bientôt`,
      text: emailHeader() +
`Bonjour ${prenom},

Votre offre "${jobTitle}" arrive à expiration prochainement.

Renouveler maintenant pour continuer à recevoir des candidatures qualifiées.

👉 Renouveler mon offre — 990 MAD / 30 jours : ${SITE_URL}/publier-offre

Cordialement,
Adil Drouz — Fondateur InteractJob.ma` + emailFooter(employer.email),
    };
  }

  throw new Error("Template inconnu: " + template);
}

/**
 * POST /api/admin/employers/send
 * Body: { employerIds: string[], template: "cold" | "followup" | "renewal" }
 * Sends emails one by one with 2s delay. Logs to email_logs collection.
 */
export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const uri = process.env.MONGODB_URI!;

  const { employerIds, template } = await req.json();
  if (!Array.isArray(employerIds) || !employerIds.length) {
    return NextResponse.json({ error: "employerIds[] requis" }, { status: 400 });
  }
  if (!["cold", "followup", "renewal"].includes(template)) {
    return NextResponse.json({ error: "template invalide" }, { status: 400 });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");
    const employersCol = db.collection("employers");
    const logsCol = db.collection("email_logs");

    // Fetch employers (filter out unsubscribed)
    const employers = await employersCol.find({
      _id: { $in: employerIds.map((id: string) => { try { return new ObjectId(id); } catch { return id; } }) },
      status: { $ne: "unsubscribed" },
    }).toArray();

    const results: Array<{ email: string; status: string; error?: string }> = [];

    for (const employer of employers) {
      // 2-second delay between sends to avoid spam
      if (results.length > 0) await new Promise(r => setTimeout(r, 2000));

      let sentStatus = "sent";
      let errMsg: string | undefined;

      try {
        const { subject, text } = buildTemplate(template, employer);
        await sendEmail({ to: employer.email, subject, text });

        // Update employer record
        await employersCol.updateOne(
          { _id: employer._id },
          { $set: { last_contacted: new Date(), status: employer.status === "prospect" ? "contacted" : employer.status } }
        );
      } catch (e: any) {
        sentStatus = "error";
        errMsg = e.message;
      }

      // Log send
      await logsCol.insertOne({
        employer_id: employer._id,
        email: employer.email,
        company: employer.company_name,
        template,
        sent_at: new Date(),
        status: sentStatus,
        error: errMsg || null,
      });

      results.push({ email: employer.email, status: sentStatus, error: errMsg });
    }

    const sent  = results.filter(r => r.status === "sent").length;
    const errors = results.filter(r => r.status === "error").length;
    return NextResponse.json({ sent, errors, results });
  } finally {
    await client.close();
  }
}
