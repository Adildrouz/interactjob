import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sendEmail } from "@/lib/mailer";
import type { Candidate } from "@/app/api/candidates/submit/route";
import type { Job } from "@/types";

const CANDIDATES_FILE = path.join(process.cwd(), "data", "candidates.json");
const SITE_URL = "https://www.interactjob.ma";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { job } = await req.json() as { job: Job & { slug?: string } };

  let candidates: Candidate[] = [];
  try { candidates = JSON.parse(await fs.readFile(CANDIDATES_FILE, "utf-8")); }
  catch { candidates = []; }

  const candidate = candidates.find(c => c.id === id);
  if (!candidate) return NextResponse.json({ error: "Candidat introuvable" }, { status: 404 });

  const jobUrl = `${SITE_URL}/offres/${job.slug || job.id}`;
  const text = `Bonjour ${candidate.firstName},

Notre équipe InteractJob a sélectionné une offre d'emploi qui pourrait correspondre à votre profil :

📌 ${job.title}
🏢 ${job.company}
📍 ${job.city}
📄 ${job.contractType}${job.salary ? `\n💰 ${job.salary}` : ""}

👉 Voir l'offre complète et postuler :
${jobUrl}

N'hésitez pas à nous contacter si vous souhaitez plus d'informations.

Cordialement,
L'équipe InteractJob.ma
contact@interactjob.ma`;

  await sendEmail({
    to: candidate.email,
    subject: `💼 Offre sélectionnée pour vous : ${job.title} chez ${job.company}`,
    text,
  });

  return NextResponse.json({ success: true });
}
