import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  githubConfigured,
  readJsonFromGithub,
  commitJsonFilesToGithub,
} from "@/lib/github-data";

const PENDING_REL = "data/pending-jobs.json";
const JOBS_REL = "data/jobs.json";
const PENDING_PATH = path.join(process.cwd(), PENDING_REL);
const JOBS_PATH = path.join(process.cwd(), JOBS_REL);

function checkAuth(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session || session.value !== "authenticated") {
    return false;
  }
  return true;
}

function toSlug(title: string, city: string): string {
  return `${title} ${city}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function sendApprovalEmail(to: string, jobTitle: string, slug: string) {
  try {
    const nodemailer = await import("nodemailer");
    const gmailUser = process.env.GMAIL_USER || "jobinteract@gmail.com";
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailPassword) {
      console.log(`[Email DRY RUN] Approval email would be sent to: ${to}`);
      return;
    }

    const transporter = nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPassword },
    });

    const jobUrl = `https://www.interactjob.ma/offres/${slug}`;
    const subject = "✅ Votre offre est en ligne — InteractJob.ma";
    const text = `Bonjour,

Votre offre "${jobTitle}" est maintenant visible sur InteractJob.ma.

👉 ${jobUrl}

Elle sera visible pendant 30 jours.

Cordialement,
InteractJob.ma`;

    await transporter.sendMail({
      from: `"InteractJob" <${gmailUser}>`,
      to,
      subject,
      text,
    });

    console.log(`✓ Approval email sent to ${to}`);
  } catch (error) {
    console.error("Email send error:", error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    console.log("[approve] Processing approval for job ID:", id);

    // Parse request body
    let pendingJob;
    try {
      const body = await req.json();
      pendingJob = body.job;
      console.log("[approve] Job data from request body:", JSON.stringify(pendingJob).slice(0, 100));
    } catch (err) {
      console.error("[approve] Failed to parse request body:", err);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!pendingJob) {
      console.error("[approve] No job data in request");
      return NextResponse.json(
        { error: "Job data is required" },
        { status: 400 }
      );
    }
    // contactEmail is mandatory: it's where candidate applications are
    // forwarded. Fall back to applicantEmail (the employer who posted).
    const contactEmail = (pendingJob.contactEmail || pendingJob.applicantEmail || "").trim();
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      console.error("[approve] Missing/invalid contact email:", pendingJob);
      return NextResponse.json(
        { error: "Email de contact employeur requis — les candidatures ne pourraient pas être transmises" },
        { status: 400 }
      );
    }

    const useGithub = githubConfigured();

    // Read current jobs — from GitHub (prod) or local disk (dev)
    let jobs = [];
    try {
      if (useGithub) {
        console.log("[approve] Reading jobs.json from GitHub");
        jobs = await readJsonFromGithub<unknown[]>(JOBS_REL);
      } else {
        console.log("[approve] Reading jobs from:", JOBS_PATH);
        const jobsData = await fs.readFile(JOBS_PATH, "utf-8");
        jobs = JSON.parse(jobsData);
      }
      if (!Array.isArray(jobs)) {
        console.warn("[approve] jobs.json is not an array, resetting");
        jobs = [];
      }
      console.log("[approve] Successfully read", jobs.length, "existing jobs");
    } catch (err) {
      console.error("[approve] Failed to read jobs.json:", err);
      jobs = [];
    }

    // Create new job object with proper fields
    const now = new Date();
    const slug = toSlug(pendingJob.title, pendingJob.city);
    console.log("[approve] Generated slug:", slug);

    const newJob = {
      id: randomUUID(),
      title: pendingJob.title || "",
      company: pendingJob.company || "",
      companyInitials: (pendingJob.company || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase() || "XX",
      companyColor: generateColor(pendingJob.company || ""),
      city: pendingJob.city || "",
      sector: pendingJob.sector || "Autre",
      contractType: pendingJob.contractType || "CDI",
      description: pendingJob.description || "",
      requirements: typeof pendingJob.requirements === 'string'
        ? pendingJob.requirements.split('\n').filter(Boolean)
        : Array.isArray(pendingJob.requirements) ? pendingJob.requirements : [],
      salary: pendingJob.salary || null,
      contactEmail,
      source: "Direct",
      sourceUrl: null,
      postedAt: now.toISOString().split("T")[0],
      featured: pendingJob.featured || false,
      sponsored: pendingJob.featured || false,
      slug,
      country: "Maroc",
      contract_type: pendingJob.contractType || "CDI",
      source_site: "Direct",
      source_url: null,
      date_posted: now.toISOString().split("T")[0],
      date_scraped: now.toISOString(),
      date_expires: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      expired: false,
      hr_commentary: "",
      meta_title: `${pendingJob.title} – ${pendingJob.city}`.slice(0, 60),
      meta_description: `Offre emploi : ${pendingJob.title} chez ${pendingJob.company} à ${pendingJob.city}. Candidatez maintenant sur InteractJob.ma.`.slice(0, 155),
      linkedin_caption: `${pendingJob.title} chez ${pendingJob.company} — ${pendingJob.city}`,
      schema: {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: pendingJob.title || "",
        description: pendingJob.description || "",
        datePosted: now.toISOString().split("T")[0],
        validThrough: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        employmentType: contractTypeToSchema(pendingJob.contractType || "CDI"),
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: pendingJob.city || "",
            addressCountry: "MA",
          },
        },
        hiringOrganization: {
          "@type": "Organization",
          name: pendingJob.company || "",
        },
      },
    };

    console.log("[approve] Created job object with ID:", newJob.id);

    // Prepend the new job (most recent first)
    jobs.unshift(newJob);

    // Read pending jobs (GitHub in prod, disk in dev) and remove the approved one
    let pendingJobs = [];
    try {
      if (useGithub) {
        console.log("[approve] Reading pending-jobs.json from GitHub");
        pendingJobs = await readJsonFromGithub<unknown[]>(PENDING_REL);
      } else {
        console.log("[approve] Reading pending jobs from:", PENDING_PATH);
        const pendingData = await fs.readFile(PENDING_PATH, "utf-8");
        pendingJobs = JSON.parse(pendingData);
      }
      if (!Array.isArray(pendingJobs)) {
        console.warn("[approve] pending-jobs.json is not an array");
        pendingJobs = [];
      }
      console.log("[approve] Found", pendingJobs.length, "pending jobs");
    } catch (err) {
      console.error("[approve] Failed to read pending-jobs.json:", err);
      pendingJobs = [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedPending = pendingJobs.filter((j: any) => j.id !== id);
    console.log(
      "[approve] Pending after removal:",
      updatedPending.length,
      "removed:",
      pendingJobs.length - updatedPending.length
    );

    // Persist both files atomically
    try {
      if (useGithub) {
        const sha = await commitJsonFilesToGithub(
          [
            { path: JOBS_REL, data: jobs },
            { path: PENDING_REL, data: updatedPending },
          ],
          `chore(admin): approve job "${newJob.title}" — ${slug}`
        );
        console.log("[approve] ✓ Committed to GitHub:", sha.slice(0, 7));
      } else {
        await fs.writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf-8");
        await fs.writeFile(
          PENDING_PATH,
          JSON.stringify(updatedPending, null, 2),
          "utf-8"
        );
        console.log("[approve] ✓ Wrote jobs.json + pending-jobs.json to disk");
      }
    } catch (writeErr) {
      console.error("[approve] Failed to persist:", writeErr);
      throw writeErr;
    }

    // Send approval email
    await sendApprovalEmail(pendingJob.applicantEmail, pendingJob.title, slug);
    console.log("[approve] ✓ Email sent to:", pendingJob.applicantEmail);

    console.log("[approve] ✓✓ Job approval complete");
    return NextResponse.json({ success: true, job: newJob });
  } catch (error) {
    console.error("[approve] FATAL Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[approve] Error message:", errorMessage);
    if (error instanceof Error && error.stack) {
      console.error("[approve] Stack trace:", error.stack);
    }
    return NextResponse.json(
      { error: `Failed to approve job: ${errorMessage}` },
      { status: 500 }
    );
  }
}

function generateColor(str: string): string {
  const colors = [
    "#7C3AED", "#E11D48", "#2563EB", "#059669", "#D97706",
    "#0891B2", "#7C2D12", "#1D4ED8", "#065F46", "#92400E",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff;
  }
  return colors[hash % colors.length];
}

function contractTypeToSchema(ct: string): string {
  const map: Record<string, string> = {
    CDI: "FULL_TIME",
    CDD: "CONTRACTOR",
    Stage: "INTERN",
  };
  return map[ct] || "OTHER";
}
