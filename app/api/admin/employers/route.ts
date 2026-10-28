import { NextRequest, NextResponse } from "next/server";
import { Filter, MongoClient, ObjectId } from "mongodb";

function verifyAuth(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

// GET — list employers with optional filters
export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const uri = process.env.MONGODB_URI!;
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "";
  const city   = searchParams.get("city") || "";
  const sector = searchParams.get("sector") || "";

  const query: Filter<{ status?: string; city?: string; sector?: string }> = {};
  if (status) query.status = status;
  if (city)   query.city = { $regex: city, $options: "i" };
  if (sector) query.sector = { $regex: sector, $options: "i" };

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const employers = await client.db("interactjob").collection("employers")
      .find(query, { projection: { password_hash: 0, email_verify_token: 0, email_verify_expires_at: 0 } })
      .sort({ last_contacted: -1, created_at: -1 })
      .limit(200)
      .toArray();
    return NextResponse.json({ employers });
  } finally {
    await client.close();
  }
}

// PATCH — update employer status/notes/phone_verified
export async function PATCH(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const uri = process.env.MONGODB_URI!;
  const { employerId, status, notes, phone_verified, last_contacted } = await req.json();
  if (typeof employerId !== "string" || !ObjectId.isValid(employerId)) return NextResponse.json({ error: "employerId invalide" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (notes !== undefined) update.notes = notes;
  if (phone_verified !== undefined) update.phone_verified = phone_verified;
  if (last_contacted !== undefined) {
    if (typeof last_contacted !== "string" || Number.isNaN(Date.parse(last_contacted))) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
    update.last_contacted = new Date(last_contacted);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const result = await client.db("interactjob").collection("employers").updateOne(
      { _id: new ObjectId(employerId) },
      { $set: update }
    );
    if (!result.matchedCount) return NextResponse.json({ error: "Employeur introuvable" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } finally {
    await client.close();
  }
}
