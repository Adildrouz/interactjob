import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { sendEmail } from "@/lib/mailer";
import { addCandidateToBrevo } from "@/lib/brevo";
import { subscribeFromApplicationOptIn } from "@/lib/alertOptIn";

const JOBS_PATH = path.join(process.cwd(), "data/jobs.json");
const ADMIN_EMAIL = "contact@interactjob.ma";
const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 Mo
const CV_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

/**
 * POST /api/apply — full application pipeline for Direct jobs:
 * 1. Store application in MongoDB "applications"
 * 2. Store CV binary in "candidatecvs" (existing pattern, served by /api/cv/[id] for admin)
 * 3. Email the employer (job.contactEmail) with the CV attached, replyTo = candidate
 * 4. Copy to admin
 * Accepts multipart/form-data (jobId, jobTitle, company, applicantName, applicantEmail,
 * coverLetter?, cv?) and legacy JSON (no file).
 */
export async function POST(req: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  let fields: Record<string, string> = {};
  let cvFile: File | null = null;

  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const fd = await req.formData();
      for (const [k, v] of fd.entries()) {
        // File detection by duck-typing — instanceof File is unreliable across
        // runtime realms (undici File vs global File in the Next.js server)
        if (typeof v === "object" && v !== null && typeof (v as any).arrayBuffer === "function") {
          if (k === "cv") cvFile = v as File;
        } else {
          fields[k] = String(v);
        }
      }
    } else {
      fields = await req.json();
    }
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { jobId, jobTitle, company, applicantName, applicantEmail, applicantPhone, applicantCity, coverLetter, subscribeAlerts, alertSecteur, alertVille, alertLanguage } = fields;
  if (!jobId || !applicantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
    return NextResponse.json({ error: "jobId et applicantEmail valide requis" }, { status: 400 });
  }

  // CV validation
  let cvBuffer: Buffer | null = null;
  if (cvFile) {
    if (cvFile.size > MAX_CV_BYTES) {
      return NextResponse.json({ error: "CV trop volumineux (max 5 Mo)" }, { status: 400 });
    }
    if (cvFile.type && !CV_TYPES.includes(cvFile.type)) {
      return NextResponse.json({ error: "Format CV non supporté (PDF, DOC, DOCX)" }, { status: 400 });
    }
    cvBuffer = Buffer.from(await cvFile.arrayBuffer());
  }

  // Look up employer contact email from jobs.json
  let contactEmail = "";
  let jobTitleReal = jobTitle || "";
  try {
    const jobs = JSON.parse(await fs.readFile(JOBS_PATH, "utf-8"));
    const job = jobs.find((j: any) => j.id === jobId);
    if (job) {
      contactEmail = job.contactEmail || "";
      jobTitleReal = job.title || jobTitleReal;
    }
  } catch { /* jobs.json unavailable — continue, admin still gets a copy */ }

  // Aggregated jobs carry the admin address as a placeholder contactEmail —
  // treating it as a real employer would double-email the admin
  if (contactEmail.toLowerCase().trim() === ADMIN_EMAIL) contactEmail = "";

  const appId = randomUUID();
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    const application = {
      id: appId,
      job_id: String(jobId),
      job_title: String(jobTitleReal),
      company: String(company || ""),
      applicant_email: String(applicantEmail).toLowerCase().trim(),
      applicant_name: String(applicantName || "").trim(),
      cv_url: cvBuffer ? `/api/cv/${appId}` : null,
      cover_letter: coverLetter ? String(coverLetter).slice(0, 5000) : null,
      status: "recue",
      created_at: new Date(),
      viewed_at: null as Date | null,
    };

    await db.collection("applications").insertOne(application);

    // Also add the applicant to the talent pool (visible in /admin/candidats).
    // Dedupe by email — existing profiles get their missing fields completed.
    try {
      const phone = (applicantPhone || "").trim()
        || (coverLetter || "").match(/T[ée]l\s*:\s*([+\d][\d\s.-]{7,})/)?.[1]?.trim() || "";
      const city = (applicantCity || "").trim();
      const existing = await db.collection("candidates").findOne({ email: application.applicant_email });
      if (existing) {
        // Fill in fields the profile is missing + refresh last-seen position/CV
        const patch: Record<string, unknown> = {};
        if (phone && !existing.phone) patch.phone = phone;
        if (city && !existing.city) patch.city = city;
        if (cvBuffer) { patch.cvPath = `/api/cv/${appId}`; patch.cvFilename = cvFile?.name || "cv.pdf"; }
        patch.position = jobTitleReal || existing.position;
        await db.collection("candidates").updateOne(
          { _id: existing._id },
          { $set: patch, $addToSet: { tags: "candidature-offre" } },
        );
      } else {
        const [firstName, ...rest] = (application.applicant_name || "").split(/\s+/);
        await db.collection("candidates").insertOne({
          id: appId,
          firstName: firstName || application.applicant_email.split("@")[0],
          lastName: rest.join(" ") || "",
          email: application.applicant_email,
          phone,
          city,
          sectors: [],
          position: jobTitleReal,
          experienceLevel: "",
          availability: "",
          languages: [],
          linkedin: "",
          about: `Candidature à « ${jobTitleReal} » chez ${company || "—"}.${coverLetter ? "\n\n" + coverLetter : ""}`,
          cvFilename: cvBuffer && cvFile ? (cvFile.name || "cv.pdf") : "",
          cvPath: cvBuffer ? `/api/cv/${appId}` : "",
          submittedAt: new Date().toISOString(),
          status: "Nouveau",
          notes: "",
          starred: false,
          viewed: false,
          tags: ["candidature-offre"],
          source: "job-application",
        });
      }
      // Sync to Brevo candidate list so they receive the weekly newsletter
      try {
        const [firstName, ...rest] = (application.applicant_name || "").split(/\s+/);
        await addCandidateToBrevo(
          application.applicant_email,
          firstName || application.applicant_email.split("@")[0],
          rest.join(" ") || "",
          city,
          jobTitleReal,
        );
      } catch { /* non-blocking */ }
    } catch (e) {
      console.error("apply: talent pool insert failed:", e);
    }

    // Store CV binary (same pattern as candidatecvs — keyed by application id)
    if (cvBuffer && cvFile) {
      await db.collection("candidatecvs").insertOne({
        candidateId: appId,
        filename: cvFile.name || "cv.pdf",
        contentType: cvFile.type || "application/pdf",
        data: cvBuffer,
        size: cvBuffer.length,
        createdAt: new Date().toISOString(),
      });
    }

    // ── Emails (best-effort — application is already saved) ───────────────────
    const attachments = cvBuffer && cvFile
      ? [{ filename: cvFile.name || "cv.pdf", content: cvBuffer, contentType: cvFile.type || "application/pdf" }]
      : undefined;

    const bodyLines = [
      `Nouvelle candidature reçue via InteractJob.ma`,
      ``,
      `Poste : ${jobTitleReal}`,
      `Entreprise : ${company || "—"}`,
      ``,
      `Candidat : ${applicantName || "—"}`,
      `Email : ${applicantEmail}`,
      applicantPhone ? `Téléphone : ${applicantPhone}` : "",
      applicantCity ? `Ville : ${applicantCity}` : "",
      coverLetter ? `\nMessage du candidat :\n${coverLetter}` : "",
      ``,
      cvBuffer ? `Le CV du candidat est en pièce jointe.` : `Aucun CV joint.`,
      ``,
      `— Pour répondre au candidat, répondez directement à cet email.`,
      `InteractJob.ma`,
    ].filter(l => l !== "").join("\n");

    const emailJobs: Promise<{ delivered: boolean }>[] = [];
    if (contactEmail) {
      emailJobs.push(sendEmail({
        to: contactEmail,
        subject: `📬 Candidature — ${jobTitleReal} — ${applicantName || applicantEmail}`,
        text: bodyLines,
        replyTo: applicantEmail,
        attachments,
      }));
    }
    emailJobs.push(sendEmail({
      to: ADMIN_EMAIL,
      subject: `[Copie] Candidature — ${jobTitleReal} — ${applicantName || applicantEmail}${contactEmail ? "" : " ⚠️ employeur sans email"}`,
      text: `${contactEmail ? `Envoyée à l'employeur : ${contactEmail}` : "⚠️ Aucun contactEmail sur cette offre — candidature NON transmise à l'employeur."}\n\n${bodyLines}`,
      replyTo: applicantEmail,
      attachments,
    }));

    const results = await Promise.allSettled(emailJobs);
    const emailErrors = results.filter(r => r.status === "rejected");
    if (emailErrors.length) {
      console.error("apply: email send failed:", (emailErrors[0] as PromiseRejectedResult).reason);
    }

    // Alert opt-in is best-effort — the application itself has already been
    // saved above regardless of whether this succeeds.
    if (subscribeAlerts === "true") {
      try {
        await subscribeFromApplicationOptIn({
          email: applicantEmail,
          secteur: alertSecteur,
          ville: alertVille || applicantCity,
          language: alertLanguage as "fr" | "ar" | "en" | undefined,
          sourcePage: "application_form",
        });
      } catch (e) {
        console.error("apply: alert opt-in failed:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      id: appId,
      emailedEmployer: !!contactEmail && results[0]?.status === "fulfilled",
    }, { status: 201 });
  } catch (err: any) {
    console.error("apply POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
