import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MongoClient, ObjectId } from "mongodb";

function verifyAuth(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

const SITE_URL = "https://www.interactjob.ma";
const MODEL = "claude-sonnet-4-20250514";

const CATEGORIES: Record<string, string> = {
  job_seeker:       "Chercheur d'emploi / Envoi de CV",
  recruiter:        "Recruteur / Prospect employeur",
  internship:       "Demande de stage",
  platform_question:"Question sur la plateforme",
  networking:       "Networking / Connexion",
  commercial:       "Offre commerciale / Démarchage",
  other:            "Autre",
};

const TEMPLATES: Record<string, string> = {
  job_seeker: `Bonjour [Prénom],\n\nMerci pour votre message et votre intérêt pour InteractJob.ma !\n\nPour soumettre officiellement votre candidature et rejoindre notre vivier de talents, je vous invite à postuler directement sur notre plateforme :\n👉 ${SITE_URL}/postuler\n\nVotre profil sera visible de tous les recruteurs qui consultent notre Talent Pool, et nous vous contacterons dès qu'une opportunité correspond à votre profil.\n\nN'hésitez pas si vous avez des questions.`,
  recruiter: `Bonjour [Prénom],\n\nMerci pour votre message ! Je serais ravi de vous présenter nos solutions de recrutement.\n\nNous proposons deux formules :\n📌 Standard — Gratuit : 30 jours, stats de base\n⭐ Sponsorisée — 990 MAD/30 jours : position premium, LinkedIn 18K+, 45 jours, stats avancées\n\nPubliez directement : ${SITE_URL}/publier\n\nSeriez-vous disponible pour en discuter cette semaine ?`,
  internship: `Bonjour [Prénom],\n\nMerci pour votre message et votre intérêt pour notre startup !\n\nNous sommes toujours ouverts aux profils motivés. Pourriez-vous préciser :\n• La durée souhaitée du stage\n• La date de début envisagée\n• Préférence présentiel ou télétravail\n\nJe reviendrai vers vous rapidement.`,
  platform_question: `Bonjour [Prénom],\n\nMerci pour votre question !\n\n[RÉPONSE PERSONNALISÉE]\n\nPour toutes les informations : ${SITE_URL}`,
  networking: `Bonjour [Prénom],\n\nMerci pour votre message et la connexion !\n\nJe suis Adil, fondateur d'InteractJob.ma — la plateforme d'emploi dédiée au marché marocain. Au plaisir d'échanger,`,
  commercial: `Bonjour [Prénom],\n\nMerci pour votre message. Nous n'avons pas de besoins correspondants pour le moment, mais je garde votre contact.\n\nBonne continuation,`,
  other: `Bonjour [Prénom],\n\nMerci pour votre message ! Je vous réponds dès que possible.\n\nCordialement,`,
};

async function classifyAndGenerate(
  claude: Anthropic,
  msg: { sender_name: string; sender_title: string; message_text: string }
) {
  // Step 1: classify
  const classRes = await claude.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{
      role: "user",
      content: `Tu es un assistant RH pour InteractJob.ma.\nAnalyse ce message LinkedIn reçu par Adil Drouz (Fondateur InteractJob.ma).\n\nExpéditeur: ${msg.sender_name}\nTitre: ${msg.sender_title}\nMessage: "${msg.message_text}"\n\nRéponds en JSON strict:\n{"category":"<job_seeker|recruiter|internship|platform_question|networking|commercial|other>","confidence":<0.0-1.0>,"language":"<fr|en|ar|other>","key_points":["..."],"sender_first_name":"<prénom>"}`
    }],
  });

  const raw = classRes.content[0].type === "text" ? classRes.content[0].text : "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Classification JSON parse failed");
  const classification = JSON.parse(jsonMatch[0]);

  // Step 2: generate draft
  const template = TEMPLATES[classification.category] || TEMPLATES.other;
  const genRes = await claude.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `Tu es Adil Drouz, Fondateur & CEO d'InteractJob.ma.\n\nMessage reçu de ${msg.sender_name} (${msg.sender_title}):\n"${msg.message_text}"\n\nCatégorie: ${CATEGORIES[classification.category]}\nPoints clés: ${(classification.key_points || []).join(", ")}\n\nModèle de base:\n---\n${template}\n---\n\nGénère une réponse personnalisée en ${classification.language === "en" ? "anglais" : classification.language === "ar" ? "arabe" : "français"}.\nRègles:\n- Remplace [Prénom] par le prénom réel\n- Adapte au contexte spécifique\n- Ton professionnel et chaleureux\n- Max 200 mots\n- Corps du message UNIQUEMENT (pas de signature)\n\nRéponds uniquement avec le corps du message.`
    }],
  });

  const draftBody = genRes.content[0].type === "text" ? genRes.content[0].text.trim() : "";
  const draft = draftBody + "\n\nAdil Drouz | Fondateur & CEO — InteractJob.ma";

  return { classification, draft };
}

// POST — process a single message by ID (called from admin UI)
export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY manquant" }, { status: 500 });

  const { messageId } = await req.json();

  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const col = client.db("interactjob").collection("linkedin_messages");

  try {
    const filter = messageId ? { _id: new ObjectId(messageId) } : { status: "pending" };
    const messages = await col.find(filter).limit(messageId ? 1 : 20).toArray();

    if (messages.length === 0) {
      return NextResponse.json({ success: true, processed: 0 });
    }

    const claude = new Anthropic({ apiKey });
    let processed = 0;

    for (const msg of messages) {
      try {
        const { classification, draft } = await classifyAndGenerate(claude, {
          sender_name:  msg.sender_name,
          sender_title: msg.sender_title || "",
          message_text: msg.message_text,
        });

        await col.updateOne(
          { _id: msg._id },
          {
            $set: {
              category:         classification.category,
              confidence:       classification.confidence,
              language:         classification.language,
              key_points:       classification.key_points || [],
              sender_firstname: classification.sender_first_name,
              response_draft:   draft,
              status:           "draft_ready",
              processed_at:     new Date().toISOString(),
            },
          }
        );
        processed++;
      } catch (e: any) {
        await col.updateOne({ _id: msg._id }, { $set: { status: "error", error: e.message } });
      }
    }

    return NextResponse.json({ success: true, processed, total: messages.length });
  } finally {
    await client.close();
  }
}
