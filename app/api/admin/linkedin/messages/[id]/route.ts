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

// PATCH — update draft / status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ["response_draft", "status", "category", "sent_at"];
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (body.status === "sent") updates.sent_at = new Date().toISOString();

  const { client, col } = await getCol();
  try {
    await col.updateOne({ _id: new ObjectId(id) }, { $set: updates });
    return NextResponse.json({ success: true });
  } finally {
    await client.close();
  }
}

// DELETE — remove message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { client, col } = await getCol();
  try {
    await col.deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } finally {
    await client.close();
  }
}
