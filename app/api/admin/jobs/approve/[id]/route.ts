import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const PENDING_PATH = path.join(process.cwd(), "data/pending-jobs.json");
const JOBS_PATH = path.join(process.cwd(), "data/jobs.json");

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
    if (!pendingJob.applicantEmail) {
      console.error("[approve] Missing applicantEmail:", pendingJob);
      return NextResponse.json(
        { error: "Applicant email is missing" },
        { status: 400 }
      );
    }

    // Read current jobs with error handling
    let jobs = [];
    try {
      console.log("[approve] Reading jobs from:", JOBS_PATH);
      const jobsData = await fs.readFile(JOBS_PATH, "utf-8");
      jobs = JSON.parse(jobsData);
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

    // Add to jobs.json
    try {
      jobs.unshift(newJob); // Add to beginning for most recent first
      console.log("[approve] About to write", jobs.length, "jobs to jobs.json");
      await fs.writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf-8");
      console.log("[approve] ✓ Job added to jobs.json");
    } catch (writeErr) {
      console.error("[approve] Failed to write jobs.json:", writeErr);
      throw writeErr;
    }

    // Remove from pending-jobs.json
    let pendingJobs = [];
    try {
      console.log("[approve] Reading pending jobs from:", PENDING_PATH);
      const pendingData = await fs.readFile(PENDING_PATH, "utf-8");
      pendingJobs = JSON.parse(pendingData);
      if (!Array.isArray(pendingJobs)) {
        console.warn("[approve] pending-jobs.json is not an array");
        pendingJobs = [];
      }
      console.log("[approve] Found", pendingJobs.length, "pending jobs");
    } catch (err) {
      console.error("[approve] Failed to read pending-jobs.json:", err);
      pendingJobs = [];
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = pendingJobs.filter((j: any) => j.id !== id);
      console.log("[approve] Filtered jobs count:", updated.length, "removed:", pendingJobs.length - updated.length);
      await fs.writeFile(PENDING_PATH, JSON.stringify(updated, null, 2), "utf-8");
      console.log("[approve] ✓ Job removed from pending-jobs.json");
    } catch (writeErr) {
      console.error("[approve] Failed to write pending-jobs.json:", writeErr);
      throw writeErr;
    }

    // Send approval email
    try {
      await sendApprovalEmail(pendingJob.applicantEmail, pendingJob.title, slug);
      console.log("[approve] ✓ Email sent to:", pendingJob.applicantEmail);
    } catch (emailErr) {
      console.error("[approve] Email send failed:", emailErr);
      // Don't throw - email failure shouldn't block job approval
    }

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
