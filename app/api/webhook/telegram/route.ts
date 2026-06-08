import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const TOKEN   = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

async function tgApi(method: string, body: object) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function getCol() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  return { client, col: client.db("interactjob").collection("linkedin_messages") };
}

export async function POST(req: NextRequest) {
  // Validate secret token set via setWebhook
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: Record<string, unknown>;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const query = update.callback_query as Record<string, unknown> | undefined;
  if (!query) return NextResponse.json({ ok: true });

  const queryId = query.id as string;
  const data    = (query.data as string) ?? "";

  const match = data.match(/^(copy|sent|skip)_([a-f0-9]{24})$/);
  if (!match) {
    await tgApi("answerCallbackQuery", { callback_query_id: queryId, text: "Action inconnue" });
    return NextResponse.json({ ok: true });
  }

  const [, action, msgId] = match;
  const { client, col } = await getCol();

  try {
    const msg = await col.findOne({ _id: new ObjectId(msgId) });
    if (!msg) {
      await tgApi("answerCallbackQuery", { callback_query_id: queryId, text: "Message introuvable" });
      return NextResponse.json({ ok: true });
    }

    if (action === "copy") {
      const draft = (msg.response_draft as string) || "Pas de réponse générée.";
      // Send full draft as a separate message so it's easy to copy
      await tgApi("sendMessage", {
        chat_id: CHAT_ID,
        text: `📋 <b>Réponse pour ${msg.sender_name}</b>\n\n${draft}`.slice(0, 4096),
        parse_mode: "HTML",
      });
      await tgApi("answerCallbackQuery", {
        callback_query_id: queryId,
        text: "Réponse envoyée ✓",
        show_alert: false,
      });
    } else if (action === "sent") {
      await col.updateOne(
        { _id: new ObjectId(msgId) },
        { $set: { status: "sent", sent_at: new Date().toISOString() } }
      );
      await tgApi("answerCallbackQuery", {
        callback_query_id: queryId,
        text: "✅ Marqué comme envoyé",
        show_alert: false,
      });
    } else if (action === "skip") {
      await col.updateOne(
        { _id: new ObjectId(msgId) },
        { $set: { status: "ignored" } }
      );
      await tgApi("answerCallbackQuery", {
        callback_query_id: queryId,
        text: "⏭ Message ignoré",
        show_alert: false,
      });
    }
  } finally {
    await client.close();
  }

  return NextResponse.json({ ok: true });
}
