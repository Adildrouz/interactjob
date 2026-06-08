/**
 * LinkedIn Message Response Agent
 *
 * Pipeline:
 *   1. Fetch pending messages from MongoDB (inserted via webhook or admin UI)
 *   2. Classify with Claude (category + confidence)
 *   3. Generate draft response in French
 *   4. Save draft back to DB with status "draft_ready"
 *   5. Notify via Telegram for validation
 *
 * Env vars required:
 *   ANTHROPIC_API_KEY, MONGODB_URI
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (optional)
 *   SITE_URL (default: https://www.interactjob.ma)
 *   AUTO_SEND_THRESHOLD (default: 0 — always require validation)
 */

import Anthropic from '@anthropic-ai/sdk';
import { MongoClient, ObjectId } from 'mongodb';
import { log } from './logger.js';

const SITE_URL   = (process.env.SITE_URL || 'https://www.interactjob.ma').replace(/\/$/, '');
const MODEL      = 'claude-sonnet-4-20250514';
const DB_NAME    = 'interactjob';
const COL        = 'linkedin_messages';

// ── Agent identity ─────────────────────────────────────────────────────────────
const AGENT_SIGNATURE = '\n\nAdil Drouz | Fondateur & CEO — InteractJob.ma';

// ── Category definitions ───────────────────────────────────────────────────────
const CATEGORIES = {
  job_seeker:       'Chercheur d\'emploi / Envoi de CV',
  recruiter:        'Recruteur / Prospect employeur',
  internship:       'Demande de stage',
  platform_question:'Question sur la plateforme',
  networking:       'Networking / Connexion',
  commercial:       'Offre commerciale / Démarchage',
  other:            'Autre',
};

// ── Response templates (used as few-shot guidance for Claude) ──────────────────
const TEMPLATES = {
  job_seeker: `Bonjour [Prénom],

Merci pour votre message et votre intérêt pour InteractJob.ma !

Pour soumettre officiellement votre candidature et rejoindre notre vivier de talents, je vous invite à postuler directement sur notre plateforme :
👉 ${SITE_URL}/postuler

Votre profil sera visible de tous les recruteurs qui consultent notre Talent Pool, et nous vous contacterons dès qu'une opportunité correspond à votre profil.

N'hésitez pas si vous avez des questions.`,

  recruiter: `Bonjour [Prénom],

Merci pour votre message ! Je serais ravi de vous présenter nos solutions de recrutement.

Chez InteractJob.ma, nous proposons deux formules :
📌 **Standard — Gratuit** : 30 jours de visibilité, statistiques de base
⭐ **Sponsorisée — 990 MAD/30 jours** : Position premium, diffusion sur notre communauté LinkedIn (18K+ membres), 45 jours de visibilité, statistiques avancées

Vous pouvez publier directement ici : ${SITE_URL}/publier

Seriez-vous disponible pour en discuter cette semaine ?`,

  internship: `Bonjour [Prénom],

Merci pour votre message et votre intérêt pour notre startup !

InteractJob.ma est en pleine croissance et nous sommes toujours ouverts aux profils motivés. Pour étudier votre candidature, pourriez-vous me préciser :
• La durée souhaitée du stage
• La date de début envisagée
• Préférence présentiel (Maroc) ou télétravail

Je reviendrai vers vous rapidement.`,

  platform_question: `Bonjour [Prénom],

Merci pour votre question !

[RÉPONSE PERSONNALISÉE]

Pour toutes les informations sur la plateforme, vous pouvez également consulter : ${SITE_URL}

N'hésitez pas si vous avez d'autres questions.`,

  networking: `Bonjour [Prénom],

Merci pour votre message et la connexion !

Je suis Adil, fondateur d'InteractJob.ma — la plateforme d'emploi dédiée au marché marocain. Nous connectons chaque jour recruteurs et candidats qualifiés.

Au plaisir d'échanger,`,

  commercial: `Bonjour [Prénom],

Merci pour votre message.

Nous n'avons pas de besoins correspondants pour le moment, mais je garde votre contact pour le futur.

Bonne continuation,`,

  other: `Bonjour [Prénom],

Merci pour votre message !

Je vous réponds dès que possible.

Cordialement,`,
};

// ── MongoDB helpers ────────────────────────────────────────────────────────────
async function getDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  return { client, db: client.db(DB_NAME), col: client.db(DB_NAME).collection(COL) };
}

// ── Telegram helpers ───────────────────────────────────────────────────────────
async function telegramApi(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  } catch (err) {
    log(`[linkedin-messages] Telegram ${method} error: ${err.message}`);
    return null;
  }
}

async function sendTelegram(text, replyMarkup) {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) return;

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  await telegramApi('sendMessage', payload);
}

export async function registerTelegramWebhook() {
  const siteUrl = process.env.SITE_URL;
  const token   = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !siteUrl) return;
  const webhookUrl = `${siteUrl.replace(/\/$/, '')}/api/webhook/telegram`;
  const secret = (process.env.WEBHOOK_SECRET || '').slice(0, 256);
  const result = await telegramApi('setWebhook', {
    url: webhookUrl,
    secret_token: secret || undefined,
    drop_pending_updates: false,
  });
  log(`[telegram] Webhook → ${webhookUrl}: ${JSON.stringify(result)}`);
}

// ── Classification ─────────────────────────────────────────────────────────────
async function classifyMessage(client, messageText, senderName, senderTitle = '') {
  const prompt = `Tu es un assistant RH pour InteractJob.ma (plateforme d'emploi marocaine).

Analyse ce message LinkedIn reçu par Adil Drouz (Fondateur & CEO — InteractJob.ma).

Expéditeur: ${senderName}
Titre: ${senderTitle}
Message: "${messageText}"

Réponds en JSON strict avec:
{
  "category": "<une de: job_seeker | recruiter | internship | platform_question | networking | commercial | other>",
  "confidence": <0.0 à 1.0>,
  "language": "<fr | en | ar | other>",
  "key_points": ["point1", "point2"],
  "sender_first_name": "<prénom extrait du nom ou 'Bonjour' si impossible>"
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Classification JSON parse failed');
  return JSON.parse(jsonMatch[0]);
}

// ── Response generation ────────────────────────────────────────────────────────
async function generateResponse(client, messageText, senderName, senderTitle, category, keyPoints, language) {
  const template = TEMPLATES[category] || TEMPLATES.other;
  const catLabel = CATEGORIES[category] || category;

  const prompt = `Tu es Adil Drouz, Fondateur & CEO d'InteractJob.ma (plateforme d'emploi pour le marché marocain, spécialisé hospitality et RH).

Tu reçois ce message LinkedIn de ${senderName} (${senderTitle || 'titre inconnu'}) :
"${messageText}"

Catégorie détectée : ${catLabel}
Points clés : ${keyPoints.join(', ')}

Voici un modèle de base :
---
${template}
---

Génère une réponse personnalisée en ${language === 'en' ? 'anglais' : language === 'ar' ? 'arabe' : 'français'}.
Règles :
- Remplace [Prénom] par le prénom réel de l'expéditeur
- Adapte le message au contexte spécifique du message reçu
- Garde un ton professionnel mais chaleureux
- Maximum 200 mots
- Ne mets PAS la signature (elle sera ajoutée automatiquement)
- Si la catégorie est "platform_question", remplace [RÉPONSE PERSONNALISÉE] par une vraie réponse

Réponds UNIQUEMENT avec le corps du message, sans introduction ni explication.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });

  const draft = response.content[0].text.trim();
  return draft + AGENT_SIGNATURE;
}

// ── Main processing function ───────────────────────────────────────────────────
export async function runLinkedInMessages() {
  log('[linkedin-messages] Démarrage du traitement des messages...');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { log('[linkedin-messages] ANTHROPIC_API_KEY manquant'); return; }
  if (!process.env.MONGODB_URI) { log('[linkedin-messages] MONGODB_URI manquant'); return; }

  const claude = new Anthropic({ apiKey });
  const { client: mongoClient, col } = await getDB();

  try {
    // Fetch all messages waiting to be processed
    const pending = await col.find({ status: 'pending' }).toArray();
    log(`[linkedin-messages] ${pending.length} message(s) en attente de traitement`);

    if (pending.length === 0) return;

    let processed = 0;
    for (const msg of pending) {
      try {
        log(`[linkedin-messages] Traitement: ${msg.sender_name}`);

        // 1. Classify
        const classification = await classifyMessage(
          claude,
          msg.message_text,
          msg.sender_name,
          msg.sender_title || ''
        );

        // 2. Generate draft
        const draft = await generateResponse(
          claude,
          msg.message_text,
          msg.sender_name,
          msg.sender_title || '',
          classification.category,
          classification.key_points || [],
          classification.language || 'fr'
        );

        // 3. Update DB
        await col.updateOne(
          { _id: msg._id },
          {
            $set: {
              category:        classification.category,
              confidence:      classification.confidence,
              language:        classification.language,
              key_points:      classification.key_points,
              sender_firstname:classification.sender_first_name,
              response_draft:  draft,
              status:          'draft_ready',
              processed_at:    new Date().toISOString(),
            },
          }
        );

        // 4. Telegram notification with inline buttons
        const catLabel = CATEGORIES[classification.category] || classification.category;
        const conf = Math.round((classification.confidence || 0) * 100);
        const msgId = msg._id.toString();
        const profileUrl = msg.sender_url || `${SITE_URL}/admin/linkedin`;

        const notifText =
          `📩 <b>Nouveau message LinkedIn traité</b>\n\n` +
          `👤 <b>${msg.sender_name}</b>${msg.sender_title ? ` — ${msg.sender_title}` : ''}\n` +
          `🏷 ${catLabel} (${conf}% confiance)\n` +
          `💬 ${msg.message_text.slice(0, 150)}${msg.message_text.length > 150 ? '…' : ''}`;

        await sendTelegram(notifText, {
          inline_keyboard: [
            [
              { text: '📋 Voir réponse', callback_data: `copy_${msgId}` },
              { text: '🔗 Profil LinkedIn', url: profileUrl },
            ],
            [
              { text: '✅ Marquer envoyé', callback_data: `sent_${msgId}` },
              { text: '⏭ Ignorer',         callback_data: `skip_${msgId}` },
            ],
          ],
        });

        processed++;
        log(`[linkedin-messages] ✓ ${msg.sender_name} → ${catLabel} (${conf}%)`);
      } catch (msgErr) {
        log(`[linkedin-messages] Erreur pour ${msg.sender_name}: ${msgErr.message}`);
        await col.updateOne({ _id: msg._id }, { $set: { status: 'error', error: msgErr.message } });
      }
    }

    log(`[linkedin-messages] ${processed}/${pending.length} messages traités`);
  } finally {
    await mongoClient.close();
  }
}

// ── Direct run support ─────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith('linkedin-messages.js')) {
  import('dotenv/config').then(() => {
    runLinkedInMessages().catch(err => { console.error(err); process.exit(1); });
  });
}
