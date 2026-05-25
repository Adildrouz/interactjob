import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Candidate } from "@/lib/models/Candidate";
import { sendEmail } from "@/lib/mailer";
import type { Job } from "@/types";

const SITE_URL = "https://www.interactjob.ma";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { id } = await params;
    const { job } = await req.json() as { job: Job & { slug?: string } };

    await connectDB();
    const candidate = await Candidate.findOne({ id });

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
  } catch (err) {
    console.error("Failed to send job suggestion:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
