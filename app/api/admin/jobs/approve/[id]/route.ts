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
    const body = await req.json();
    const pendingJob = body.job;

    // Read current jobs
    const jobsData = await fs.readFile(JOBS_PATH, "utf-8");
    const jobs = JSON.parse(jobsData);

    // Create new job object with proper fields
    const now = new Date();
    const slug = toSlug(pendingJob.title, pendingJob.city);

    const newJob = {
      id: randomUUID(),
      title: pendingJob.title,
      company: pendingJob.company,
      companyInitials: pendingJob.company
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase() || "XX",
      companyColor: generateColor(pendingJob.company),
      city: pendingJob.city,
      sector: pendingJob.sector,
      contractType: pendingJob.contractType,
      description: pendingJob.description || "",
      requirements: pendingJob.requirements || "",
      salary: pendingJob.salary || null,
      source: "Direct",
      sourceUrl: null,
      postedAt: now.toISOString().split("T")[0],
      featured: pendingJob.featured || false,
      sponsored: pendingJob.featured || false,
      slug,
      country: "Maroc",
      contract_type: pendingJob.contractType,
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
        title: pendingJob.title,
        description: pendingJob.description || "",
        datePosted: now.toISOString().split("T")[0],
        validThrough: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        employmentType: contractTypeToSchema(pendingJob.contractType),
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: pendingJob.city,
            addressCountry: "MA",
          },
        },
        hiringOrganization: {
          "@type": "Organization",
          name: pendingJob.company,
        },
      },
    };

    // Add to jobs.json
    jobs.push(newJob);
    await fs.writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf-8");

    // Remove from pending-jobs.json
    const pendingData = await fs.readFile(PENDING_PATH, "utf-8");
    const pendingJobs = JSON.parse(pendingData);
    const updated = pendingJobs.filter((j: any) => j.id !== id);
    await fs.writeFile(PENDING_PATH, JSON.stringify(updated, null, 2), "utf-8");

    // Send approval email
    await sendApprovalEmail(pendingJob.applicantEmail, pendingJob.title, slug);

    return NextResponse.json({ success: true, job: newJob });
  } catch (error) {
    console.error("Approve job error:", error);
    return NextResponse.json(
      { error: "Failed to approve job" },
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
