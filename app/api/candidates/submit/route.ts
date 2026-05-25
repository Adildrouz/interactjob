import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { sendEmail } from "@/lib/mailer";
import { connectDB } from "@/lib/db";
import { Candidate, type ICandidate } from "@/lib/models/Candidate";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "cvs");

const WHATSAPP_URL = "https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j";
const SITE_URL = "https://www.interactjob.ma";
const ADMIN_EMAIL = "contact@interactjob.ma";

// Export for backward compatibility
export type { ICandidate as Candidate };

function required(value: string | null, field: string): string {
  if (!value || !value.trim()) throw new Error(`${field} est requis`);
  return value.trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Validate required text fields
    const firstName = required(formData.get("firstName") as string, "Prénom");
    const lastName = required(formData.get("lastName") as string, "Nom");
    const email = required(formData.get("email") as string, "Email");
    const phone = required(formData.get("phone") as string, "Téléphone");
    const city = required(formData.get("city") as string, "Ville");
    const position = required(formData.get("position") as string, "Poste recherché");
    const experienceLevel = required(formData.get("experienceLevel") as string, "Niveau d'expérience");
    const availability = required(formData.get("availability") as string, "Disponibilité");
    const about = required(formData.get("about") as string, "À propos");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (!/^(\+212|06|07)/.test(phone)) {
      return NextResponse.json({ error: "Téléphone invalide (doit commencer par +212, 06 ou 07)" }, { status: 400 });
    }
    if (about.length < 50) {
      return NextResponse.json({ error: "À propos doit contenir au moins 50 caractères" }, { status: 400 });
    }

    const sectors = formData.getAll("sectors") as string[];
    const languages = formData.getAll("languages") as string[];
    const linkedin = (formData.get("linkedin") as string | null)?.trim() || "";

    if (sectors.length === 0) {
      return NextResponse.json({ error: "Sélectionnez au moins un secteur" }, { status: 400 });
    }

    // Validate PDF
    const cvFile = formData.get("cv") as File | null;
    if (!cvFile || cvFile.size === 0) {
      return NextResponse.json({ error: "CV requis" }, { status: 400 });
    }
    if (cvFile.type !== "application/pdf" && !cvFile.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Le CV doit être au format PDF" }, { status: 400 });
    }
    if (cvFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Le CV ne doit pas dépasser 5 Mo" }, { status: 400 });
    }

    // Save PDF (or note if not possible)
    const id = crypto.randomUUID();
    const sanitized = cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/_{2,}/g, "_");
    const cvFilename = `${id}-${sanitized}`;
    const cvPath = `/uploads/cvs/${cvFilename}`;

    let savedCvPath = cvPath;
    try {
      // Try to save to public directory
      const { promises: fs } = await import("fs");
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      const buffer = Buffer.from(await cvFile.arrayBuffer());
      await fs.writeFile(path.join(UPLOADS_DIR, cvFilename), buffer);
    } catch {
      // On Vercel/Railway read-only filesystem - save to /tmp as fallback
      try {
        const { promises: fs } = await import("fs");
        const tmpDir = "/tmp/cvs";
        await fs.mkdir(tmpDir, { recursive: true });
        const buffer = Buffer.from(await cvFile.arrayBuffer());
        await fs.writeFile(path.join(tmpDir, cvFilename), buffer);
        savedCvPath = `/tmp/cvs/${cvFilename}`;
      } catch {
        savedCvPath = ""; // CV email still works without file
      }
    }

    // Build candidate object
    const candidate: ICandidate = {
      id,
      firstName,
      lastName,
      email,
      phone,
      city,
      sectors,
      position,
      experienceLevel,
      availability,
      languages,
      linkedin,
      about,
      cvFilename,
      cvPath: savedCvPath,
      submittedAt: new Date().toISOString(),
      status: "Nouveau",
      notes: "",
      starred: false,
      viewed: false,
      tags: [],
      source: "website-form",
    };

    // Save to MongoDB
    try {
      await connectDB();
      await Candidate.create(candidate);
    } catch (err) {
      console.error("Failed to save candidate to MongoDB:", err);
      // Email still goes through even if database save fails
    }

    // Email to candidate
    const candidateEmail = `Bonjour ${firstName},

Nous avons bien reçu votre candidature pour le poste de ${position}.

Votre profil a été ajouté à notre base de candidats.
Nous vous contacterons dès qu'une opportunité correspond à votre profil.

En attendant, consultez nos offres du moment :
👉 ${SITE_URL}/offres

Rejoignez aussi notre chaîne WhatsApp pour les alertes emploi quotidiennes :
📲 ${WHATSAPP_URL}

Cordialement,
L'équipe InteractJob.ma
contact@interactjob.ma`;

    // Notification to admin
    const adminEmail = `Nouvelle candidature reçue sur InteractJob.ma

Nom: ${firstName} ${lastName}
Email: ${email}
Téléphone: ${phone}
Ville: ${city}
Poste recherché: ${position}
Secteurs: ${sectors.join(", ")}
Expérience: ${experienceLevel}
Disponibilité: ${availability}
LinkedIn: ${linkedin || "Non renseigné"}

À propos:
${about}

CV: ${cvFilename}
Disponible dans /admin/candidats

👉 Voir le profil: ${SITE_URL}/admin/candidats`;

    await Promise.allSettled([
      sendEmail({ to: email, subject: "✅ Candidature reçue — InteractJob.ma", text: candidateEmail }),
      sendEmail({ to: ADMIN_EMAIL, subject: `🔔 Nouvelle candidature — ${firstName} ${lastName} — ${position}`, text: adminEmail }),
    ]);

    return NextResponse.json({ success: true, message: "Candidature reçue" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
