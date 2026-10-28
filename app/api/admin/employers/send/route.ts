import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { sendEmail } from "@/lib/mailer";
import { excludedFromRecruiterOutreach } from "@/lib/recruiter-policy";

function verifyAuth(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

// ─── Email templates ─────────────────────────────────────────────────────────
const SITE_URL = "https://www.interactjob.ma";
const UNSUBSCRIBE_URL = `${SITE_URL}/api/unsubscribe`;

interface OutreachEmployer { company_name?: string; contact_name?: string; email: string; last_job_title?: string; status?: string; }

function buildTemplate(template: string, employer: OutreachEmployer): { subject: string; text: string } {
  const company = employer.company_name || "votre entreprise";
  const introduction = template === "followup"
    ? "Je reviens vers vous pour vous transmettre le lien direct de publication gratuite."
    : template === "renewal"
      ? `Si votre besoin pour « ${employer.last_job_title || "votre offre"} » est toujours d’actualité, vous pouvez déposer une nouvelle annonce gratuitement.`
      : `Si ${company} a des besoins en recrutement, vous pouvez publier vos annonces gratuitement sur InteractJob.`;
  return {
    subject: `${company} — publiez gratuitement vos besoins en recrutement`,
    text: `Bonjour,\n\n${introduction}\n\nDéposez votre annonce directement, sans compte ni paiement :\n${SITE_URL}/publier\n\nNotre équipe examine les annonces avant leur mise en ligne. Vous pouvez également répondre à cet email avec votre annonce et les coordonnées de candidature.\n\nL’équipe InteractJob\ncontact@interactjob.ma\n\nPour vous désinscrire : ${UNSUBSCRIBE_URL}?email=${encodeURIComponent(employer.email)}\n`,
  };
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
    const employersCol = db.collection<OutreachEmployer>("employers");
    const logsCol = db.collection("email_logs");

    // Fetch employers (filter out unsubscribed)
    const employers = await employersCol.find({
      _id: { $in: employerIds.flatMap((id: string) => { try { return [new ObjectId(id)]; } catch { return []; } }) },
      status: { $ne: "unsubscribed" },
    }).toArray();

    const results: Array<{ email: string; status: string; error?: string }> = [];

    for (const employer of employers) {
      if (excludedFromRecruiterOutreach(employer.company_name || "", employer.email || "")) continue;
      // 2-second delay between sends to avoid spam
      if (results.length > 0) await new Promise(r => setTimeout(r, 2000));

      let sentStatus = "sent";
      let errMsg: string | undefined;

      try {
        const { subject, text } = buildTemplate(template, employer);
        const delivery = await sendEmail({ to: employer.email, subject, text });
        if (!delivery.delivered) throw new Error("Email non envoyé : configuration email absente.");

        // Update employer record
        await employersCol.updateOne(
          { _id: employer._id },
          { $set: { last_contacted: new Date(), status: employer.status === "prospect" ? "contacted" : employer.status } }
        );
      } catch (e) {
        sentStatus = "error";
        errMsg = e instanceof Error ? e.message : "Erreur inconnue";
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
