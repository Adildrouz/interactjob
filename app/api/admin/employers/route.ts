import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

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

  const query: Record<string, any> = {};
  if (status) query.status = status;
  if (city)   query.city = { $regex: city, $options: "i" };
  if (sector) query.sector = { $regex: sector, $options: "i" };

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const employers = await client.db("interactjob").collection("employers")
      .find(query)
      .sort({ last_contacted: -1, created_at: -1 })
      .limit(200)
      .toArray();
    return NextResponse.json({ employers });
  } finally {
    await client.close();
  }
}

// PATCH — update employer status/notes
export async function PATCH(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const uri = process.env.MONGODB_URI!;
  const { employerId, status, notes } = await req.json();
  if (!employerId) return NextResponse.json({ error: "employerId requis" }, { status: 400 });

  const update: Record<string, any> = {};
  if (status) update.status = status;
  if (notes !== undefined) update.notes = notes;

  const client = new MongoClient(uri);
  try {
    await client.connect();
    await client.db("interactjob").collection("employers").updateOne(
      { _id: employerId } as any,
      { $set: update }
    );
    return NextResponse.json({ ok: true });
  } finally {
    await client.close();
  }
}
