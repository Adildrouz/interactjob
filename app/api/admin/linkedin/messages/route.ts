import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

function verifyAuth(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

async function getCol() {
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  return { client, col: client.db("interactjob").collection("linkedin_messages") };
}

// GET — list messages, optional ?status=pending|draft_ready|approved|sent|skipped
export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") || "";
  const { client, col } = await getCol();
  try {
    const filter = status ? { status } : {};
    const messages = await col
      .find(filter)
      .sort({ created_at: -1 })
      .limit(100)
      .toArray();
    const counts = await col.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).toArray();
    const byStatus: Record<string, number> = {};
    for (const c of counts) byStatus[c._id as string] = c.count;
    return NextResponse.json({ messages, byStatus });
  } finally {
    await client.close();
  }
}

// POST — add a new message (from UI manual entry or Phantombuster webhook)
export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { sender_name, sender_url, sender_title, message_text } = body;

  if (!sender_name || !message_text) {
    return NextResponse.json({ error: "sender_name et message_text requis" }, { status: 400 });
  }

  const { client, col } = await getCol();
  try {
    // Avoid duplicates (same sender + same message text)
    const exists = await col.findOne({ sender_name, message_text });
    if (exists) {
      return NextResponse.json({ duplicate: true, id: exists._id.toString() });
    }

    const doc = {
      sender_name:  sender_name.trim(),
      sender_url:   sender_url?.trim() || "",
      sender_title: sender_title?.trim() || "",
      message_text: message_text.trim(),
      category:     null,
      confidence:   null,
      language:     null,
      key_points:   [],
      sender_firstname: null,
      response_draft: null,
      status:       "pending",
      created_at:   new Date().toISOString(),
      processed_at: null,
      sent_at:      null,
    };

    const result = await col.insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } finally {
    await client.close();
  }
}
