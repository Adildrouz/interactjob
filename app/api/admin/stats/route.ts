import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

function verifyAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    const [
      cvTotal,
      cvPaid,
      personalityTotal,
      personalityPaid,
      candidatesTotal,
    ] = await Promise.all([
      db.collection("cvcheckusages").countDocuments(),
      db.collection("cvcheckusages").countDocuments({ paid: true }),
      db.collection("personalitytestusages").countDocuments(),
      db.collection("personalitytestusages").countDocuments({ paid: true }),
      db.collection("candidates").countDocuments(),
    ]);

    const REVENUE_TARGET = 48730;
    const revenueMad = cvPaid * 55 + personalityPaid * 50;
    const revenueProgress = Math.min(100, Math.round((revenueMad / REVENUE_TARGET) * 100));

    return NextResponse.json({
      cv: { total: cvTotal, paid: cvPaid },
      personality: { total: personalityTotal, paid: personalityPaid },
      candidates: candidatesTotal,
      revenue: { mad: revenueMad, target: REVENUE_TARGET, progress: revenueProgress },
    });
  } catch (err: any) {
    console.error("stats GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
