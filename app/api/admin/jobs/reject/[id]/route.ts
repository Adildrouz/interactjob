import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const PENDING_PATH = path.join(process.cwd(), "data/pending-jobs.json");

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

    // Update pending-jobs.json to mark as rejected
    const pendingData = await fs.readFile(PENDING_PATH, "utf-8");
    const pendingJobs = JSON.parse(pendingData);
    const updated = pendingJobs.map((j: any) =>
      j.id === id ? { ...j, status: "rejected" } : j
    );
    await fs.writeFile(PENDING_PATH, JSON.stringify(updated, null, 2), "utf-8");

    // Send rejection email
    await sendRejectionEmail(pendingJob.applicantEmail, pendingJob.title);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject job error:", error);
    return NextResponse.json(
      { error: "Failed to reject job" },
      { status: 500 }
    );
  }
}
