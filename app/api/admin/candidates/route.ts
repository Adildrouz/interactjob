import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

function verifyAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search   = searchParams.get("search")?.toLowerCase() || "";
  const city     = searchParams.get("city")    || "";
  const sector   = searchParams.get("sector")  || "";
  const status   = searchParams.get("status")  || "";
  const exp      = searchParams.get("exp")     || "";
  const dispo    = searchParams.get("dispo")   || "";
  const starred  = searchParams.get("starred") === "true";
  const unviewed = searchParams.get("unviewed") === "true";

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");
    const raw = await db.collection("candidates").find({}).sort({ submittedAt: -1 }).toArray();

    // Normalize _id to id
    const candidates: any[] = raw.map((c) => ({ ...c, id: c._id.toString(), _id: undefined }));

    let filtered: any[] = candidates;
    if (search)   filtered = filtered.filter(c => `${c.firstName} ${c.lastName} ${c.email} ${c.position}`.toLowerCase().includes(search));
    if (city)     filtered = filtered.filter(c => c.city === city);
    if (sector)   filtered = filtered.filter(c => Array.isArray(c.sectors) && c.sectors.includes(sector));
    if (status)   filtered = filtered.filter(c => c.status === status);
    if (exp)      filtered = filtered.filter(c => c.experienceLevel === exp);
    if (dispo)    filtered = filtered.filter(c => c.availability === dispo);
    if (starred)  filtered = filtered.filter(c => c.starred);
    if (unviewed) filtered = filtered.filter(c => !c.viewed);

    return NextResponse.json({ candidates: filtered });
  } catch (err: any) {
    console.error("candidates GET error:", err);
    return NextResponse.json({ error: err.message, candidates: [] }, { status: 500 });
  } finally {
    await client.close();
  }
}
