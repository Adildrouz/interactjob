import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  githubConfigured,
  readJsonFromGithub,
  commitJsonFilesToGithub,
} from "@/lib/github-data";

const PENDING_REL = "data/pending-jobs.json";
const PENDING_PATH = path.join(process.cwd(), PENDING_REL);

function checkAuth(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session || session.value !== "authenticated") {
    return false;
  }
  return true;
}

async function sendRejectionEmail(to: string, jobTitle: string) {
  try {
    const nodemailer = await import("nodemailer");
    const gmailUser = process.env.GMAIL_USER || "jobinteract@gmail.com";
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailPassword) {
      console.log(`[Email DRY RUN] Rejection email would be sent to: ${to}`);
      return;
    }

    const transporter = nodemailer.default.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: gmailUser, pass: gmailPassword },
    });

    const subject = "⚠️ Votre offre n'a pas été approuvée — InteractJob.ma";
    const text = `Bonjour,

Nous avons examiné votre offre d'emploi "${jobTitle}".

Malheureusement, elle ne respecte pas nos critères de publication. Nous vous invitons à :
- Vérifier les informations fournies
- Consulter nos directives de publication
- Réessayer avec une offre révisée

Pour plus d'informations, contactez-nous.

Cordialement,
InteractJob.ma`;

    await transporter.sendMail({
      from: `"InteractJob" <${gmailUser}>`,
      to,
      subject,
      text,
    });

    console.log(`✓ Rejection email sent to ${to}`);
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

    console.log("[reject] Request for job ID:", id);
    console.log("[reject] Job data received:", pendingJob);

    if (!pendingJob) {
      return NextResponse.json(
        { error: "Job data is required" },
        { status: 400 }
      );
    }
    if (!pendingJob.applicantEmail) {
      return NextResponse.json(
        { error: "Applicant email is missing" },
        { status: 400 }
      );
    }

    const useGithub = githubConfigured();

    // Read pending jobs — from GitHub (prod) or local disk (dev)
    let pendingJobs = [];
    try {
      if (useGithub) {
        pendingJobs = await readJsonFromGithub<unknown[]>(PENDING_REL);
      } else {
        const pendingData = await fs.readFile(PENDING_PATH, "utf-8");
        pendingJobs = JSON.parse(pendingData);
      }
      if (!Array.isArray(pendingJobs)) pendingJobs = [];
    } catch (err) {
      console.log("[reject] pending-jobs.json read failed", err);
    }

    // Remove the job entirely
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = pendingJobs.filter((j: any) => j.id !== id);

    if (useGithub) {
      const sha = await commitJsonFilesToGithub(
        [{ path: PENDING_REL, data: updated }],
        `chore(admin): reject pending job "${pendingJob.title}"`
      );
      console.log("[reject] ✓ Committed to GitHub:", sha.slice(0, 7));
    } else {
      await fs.writeFile(
        PENDING_PATH,
        JSON.stringify(updated, null, 2),
        "utf-8"
      );
      console.log("[reject] Job removed from pending-jobs.json");
    }

    // Send rejection email
    await sendRejectionEmail(pendingJob.applicantEmail, pendingJob.title);
    console.log("[reject] Rejection email sent");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[reject] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reject job: ${errorMessage}` },
      { status: 500 }
    );
  }
}
