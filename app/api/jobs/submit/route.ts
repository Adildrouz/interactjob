import { after, NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  githubConfigured,
  appendJsonArrayToGithub,
} from "@/lib/github-data";
import { sendEmail } from "@/lib/mailer";
import { trackServerEvent } from "@/lib/trackServerEvent";

const ADMIN_EMAIL = "contact@interactjob.ma";

const PENDING_REL = "data/pending-jobs.json";
const PENDING_PATH = path.join(process.cwd(), PENDING_REL);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Demande invalide.' }, { status: 400 });
    }
    for (const key of ['title', 'company', 'city', 'sector', 'sectorOther', 'contractType', 'description', 'requirements', 'salary', 'contactEmail']) {
      if (body[key] != null && typeof body[key] !== 'string') {
        return NextResponse.json({ error: 'Format de champ invalide.' }, { status: 400 });
      }
    }
    const {
      title,
      company,
      city,
      sector,
      sectorOther,
      contractType,
      description,
      requirements,
      salary,
      contactEmail,
    } = body;

    // Paid sponsoring retired (free-first strategy): every public submission
    // is a standard free listing. Premium visibility is handled manually via
    // /recruteurs, so `featured` is never accepted from the client.
    const featured = false;
    const paymentId = null;

    // Validate required fields
    if (
      !title?.trim() ||
      !company?.trim() ||
      !city ||
      !sector ||
      !contractType ||
      !description?.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail?.trim() || '')
    ) {
      return NextResponse.json(
        { error: "Complétez le poste, l’entreprise, la ville, le secteur, le contrat, la description et un email valide." },
        { status: 400 }
      );
    }

    // Create job object
    const newJob = {
      id: randomUUID(),
      title: title.trim(),
      company: company.trim(),
      city,
      sector,
      sectorOther: sector === "Autre" ? (sectorOther || "").trim() : "",
      contractType,
      description: description.trim(),
      requirements: requirements?.trim() || '',
      salary: salary?.trim() || null,
      featured: featured || false,
      paymentId: featured && paymentId ? paymentId : null,
      applicantEmail: contactEmail.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    const useGithub = githubConfigured();

    // Persist (GitHub commit in prod, disk in dev)
    if (useGithub) {
      await appendJsonArrayToGithub(PENDING_REL, newJob, `chore(submit): publication request ${newJob.id} [skip ci]`);
    } else {
      if (process.env.VERCEL) throw new Error('Publication persistence is not configured');
      let pendingJobs = [];
      try { pendingJobs = JSON.parse(await fs.readFile(PENDING_PATH, 'utf8')); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      if (!Array.isArray(pendingJobs)) throw new Error('Invalid pending jobs data');
      pendingJobs.push(newJob);
      await fs.writeFile(
        PENDING_PATH,
        JSON.stringify(pendingJobs, null, 2),
        "utf-8"
      );
      console.log(`✓ Job submitted: ${title} from ${company}`);
    }

    // The request is durable before email; after() keeps sends alive on Vercel.
    after(async () => {
      const storedEvent = trackServerEvent('recruiter_publication', 'stored');
      const notifications = await Promise.allSettled([sendEmail({
      to: ADMIN_EMAIL,
      subject: `🆕 Demande de publication — ${newJob.title} — ${newJob.company}${featured ? " ⭐ SPONSORISÉE" : ""}`,
      text: [
        `Nouvelle demande de publication d'offre sur InteractJob.ma`,
        ``,
        `Poste : ${newJob.title}`,
        `Entreprise : ${newJob.company}`,
        `Ville : ${city} · ${contractType} · ${sector}`,
        newJob.salary ? `Salaire : ${newJob.salary}` : "",
        `Email employeur : ${newJob.applicantEmail}`,
        featured ? `⭐ Offre SPONSORISÉE (paiement vérifié : ${paymentId})` : "Offre standard (gratuite)",
        ``,
        `Description :`,
        description.trim().slice(0, 500),
        ``,
        `👉 Approuver / rejeter : https://www.interactjob.ma/admin/offres`,
      ].filter(l => l !== "").join("\n"),
      replyTo: newJob.applicantEmail,
      }), sendEmail({
        to: newJob.applicantEmail,
        subject: 'Votre annonce a bien été reçue — InteractJob',
        text: `Bonjour,\n\nVotre annonce « ${newJob.title} » a été enregistrée sous la référence ${newJob.id}. Elle attend notre validation et n’est pas encore en ligne. Vous recevrez le lien après publication.\n\nPour toute question : contact@interactjob.ma\n\nL’équipe InteractJob`,
        replyTo: ADMIN_EMAIL,
      })]);
      notifications.forEach((result, index) => {
        if (result.status === 'rejected' || !result.value.delivered) console.error(`[submit] ${index === 0 ? 'admin' : 'employer'} notification failed for ${newJob.id}`);
      });
      await Promise.all([storedEvent, ...notifications.map((result, index) => trackServerEvent('recruiter_publication',
        `${index === 0 ? 'admin' : 'employer'}_notification_${result.status === 'fulfilled' && result.value.delivered ? 'sent' : 'failed'}`))]);
    });

    return NextResponse.json({ success: true, reference: newJob.id, status: 'pending' }, { status: 201 });
  } catch (error) {
    after(async () => { await trackServerEvent('recruiter_publication', 'storage_error'); });
    console.error("Job submission error:", error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer votre annonce. Réessayez ou envoyez-la à contact@interactjob.ma." },
      { status: 500 }
    );
  }
}
