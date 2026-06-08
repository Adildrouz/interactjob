import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

// Phantombuster sends scraped LinkedIn messages to this endpoint.
// Configure in Phantombuster: "Webhook" → POST to https://interactjob.ma/api/webhook/phantombuster
// Add header: x-webhook-secret: <WEBHOOK_SECRET env var>

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Phantombuster can send either a single message object or an array
  const messages = Array.isArray(body) ? body : [body];
  if (messages.length === 0) return NextResponse.json({ success: true, inserted: 0 });

  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const col = client.db("interactjob").collection("linkedin_messages");

  let inserted = 0;
  let duplicates = 0;

  try {
    for (const m of messages) {
      // Normalize Phantombuster field names (may vary by phantom type)
      const sender_name  = m.senderName  || m.sender_name  || m.name      || "";
      const sender_url   = m.senderUrl   || m.sender_url   || m.profileUrl || "";
      const sender_title = m.senderTitle || m.sender_title || m.headline   || "";
      const message_text = m.messageText || m.message_text || m.message    || m.content || "";

      if (!sender_name || !message_text) continue;

      const exists = await col.findOne({ sender_name, message_text });
      if (exists) { duplicates++; continue; }

      await col.insertOne({
        sender_name:      sender_name.trim(),
        sender_url:       sender_url.trim(),
        sender_title:     sender_title.trim(),
        message_text:     message_text.trim(),
        category:         null,
        confidence:       null,
        language:         null,
        key_points:       [],
        sender_firstname: null,
        response_draft:   null,
        status:           "pending",
        source:           "phantombuster",
        created_at:       new Date().toISOString(),
        processed_at:     null,
        sent_at:          null,
      });
      inserted++;
    }

    return NextResponse.json({ success: true, inserted, duplicates });
  } finally {
    await client.close();
  }
}
