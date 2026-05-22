import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sendEmail } from "@/lib/mailer";

const CANDIDATES_FILE = path.join(process.cwd(), "data", "candidates.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "cvs");

const WHATSAPP_URL = "https://whatsapp.com/channel/0029VbDDkicIXnlrXOBWxJ1j";
const SITE_URL = "https://www.interactjob.ma";
const ADMIN_EMAIL = "contact@interactjob.ma";

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  sectors: string[];
  position: string;
  experienceLevel: string;
  availability: string;
  languages: string[];
  linkedin: string;
  about: string;
  cvFilename: string;
  cvPath: string;
  submittedAt: string;
  status: string;
  notes: string;
  starred: boolean;
  viewed: boolean;
  tags: string[];
  source: string;
}

function required(value: string | null, field: string): string {
  if (!value || !value.trim()) throw new Error(`${field} est requis`);
  return value.trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // â”€â”€ Validate required text fields â”€â”€
    const firstName    = required(formData.get("firstName") as string, "PrÃ©nom");
    const lastName     = required(formData.get("lastName")  as string, "Nom");
    const email        = required(formData.get("email")     as string, "Email");
    const phone        = required(formData.get("phone")     as string, "TÃ©lÃ©phone");
    const city         = required(formData.get("city")      as string, "Ville");
    const position     = required(formData.get("position")  as string, "Poste recherchÃ©");
    const experienceLevel = required(formData.get("experienceLevel") as string, "Niveau d'expÃ©rience");
    const availability = required(formData.get("availability") as string, "DisponibilitÃ©");
    const about        = required(formData.get("about")     as string, "Ã€ propos");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (!/^(\+212|06|07)/.test(phone)) {
      return NextResponse.json({ error: "TÃ©lÃ©phone invalide (doit commencer par +212, 06 ou 07)" }, { status: 400 });
    }
    if (about.length < 50) {
      return NextResponse.json({ error: "Ã€ propos doit contenir au moins 50 caractÃ¨res" }, { status: 400 });
    }

    const sectors   = formData.getAll("sectors")   as string[];
    const languages = formData.getAll("languages") as string[];
    const linkedin  = (formData.get("linkedin") as string | null)?.trim() || "";

    if (sectors.length === 0) {
      return NextResponse.json({ error: "SÃ©lectionnez au moins un secteur" }, { status: 400 });
    }

    // â”€â”€ Validate PDF â”€â”€
    const cvFile = formData.get("cv") as File | null;
    if (!cvFile || cvFile.size === 0) {
      return NextResponse.json({ error: "CV requis" }, { status: 400 });
    }
    if (cvFile.type !== "application/pdf" && !cvFile.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Le CV doit Ãªtre au format PDF" }, { status: 400 });
    }
    if (cvFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Le CV ne doit pas dÃ©passer 5 Mo" }, { status: 400 });
    }

    // â”€â”€ Save PDF â”€â”€
    const id = crypto.randomUUID();
    const sanitized = cvFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/_{2,}/g, "_");
    const cvFilename = `${id}-${sanitized}`;
    const cvPath = `/uploads/cvs/${cvFilename}`;

    let savedCvPath = cvPath;
    try {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      const buffer = Buffer.from(await cvFile.arrayBuffer());
      await fs.writeFile(path.join(UPLOADS_DIR, cvFilename), buffer);
    } catch {
      // On Vercel the filesystem is read-only at runtime â€” save to /tmp as fallback
      try {
        const tmpDir = "/tmp/cvs";
        await fs.mkdir(tmpDir, { recursive: true });
        const buffer = Buffer.from(await cvFile.arrayBuffer());
        await fs.writeFile(path.join(tmpDir, cvFilename), buffer);
        savedCvPath = `/tmp/cvs/${cvFilename}`;
      } catch {
        savedCvPath = ""; // CV email still works without file
      }
    }

    // â”€â”€ Build candidate object â”€â”€
    const candidate: Candidate = {
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

    // â”€â”€ Append to candidates.json â”€â”€
    try {
      let existing: Candidate[] = [];
      try {
        const raw = await fs.readFile(CANDIDATES_FILE, "utf-8");
        existing = JSON.parse(raw);
      } catch {
        existing = [];
      }
      existing.push(candidate);
      await fs.writeFile(CANDIDATES_FILE, JSON.stringify(existing, null, 2));
    } catch {
      // Vercel runtime: file write will fail â€” emails still go through
    }

    // â”€â”€ Email to candidate â”€â”€
    const candidateEmail = `Bonjour ${firstName},

Nous avons bien reÃ§u votre candidature pour le poste de ${position}.

Votre profil a Ã©tÃ© ajoutÃ© Ã  notre base de candidats.
Nous vous contacterons dÃ¨s qu'une opportunitÃ© correspond Ã  votre profil.

En attendant, consultez nos offres du moment :
ðŸ‘‰ ${SITE_URL}/offres

Rejoignez aussi notre chaÃ®ne WhatsApp pour les alertes emploi quotidiennes :
ðŸ“² ${WHATSAPP_URL}

Cordialement,
L'Ã©quipe InteractJob.ma
contact@interactjob.ma`;

    // â”€â”€ Notification to admin â”€â”€
    const adminEmail = `Nouvelle candidature reÃ§ue sur InteractJob.ma

Nom: ${firstName} ${lastName}
Email: ${email}
TÃ©lÃ©phone: ${phone}
Ville: ${city}
Poste recherchÃ©: ${position}
Secteurs: ${sectors.join(", ")}
ExpÃ©rience: ${experienceLevel}
DisponibilitÃ©: ${availability}
LinkedIn: ${linkedin || "Non renseignÃ©"}

Ã€ propos:
${about}

CV: ${cvFilename}
Disponible dans /admin/candidats

ðŸ‘‰ Voir le profil: ${SITE_URL}/admin/candidats`;

    await Promise.allSettled([
      sendEmail({ to: email,        subject: "âœ… Candidature reÃ§ue â€” InteractJob.ma",                  text: candidateEmail }),
      sendEmail({ to: ADMIN_EMAIL,  subject: `ðŸ†• Nouvelle candidature â€” ${firstName} ${lastName} â€” ${position}`, text: adminEmail }),
    ]);

    return NextResponse.json({ success: true, message: "Candidature reÃ§ue" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

