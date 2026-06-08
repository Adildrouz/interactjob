import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

function verifyAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

// December 2026 combined target: 48,730 MAD — per service
const DEC_TARGETS = { cv: 20000, personality: 12000, annonces: 9900, services: 6830 };

// Monthly scale toward December (6 = June 2026, start of ramp-up)
const MONTHLY_SCALE: Record<number, number> = {
  6: 0.12, 7: 0.22, 8: 0.35, 9: 0.50, 10: 0.65, 11: 0.82, 12: 1.0,
};

function monthlyTarget(decTarget: number, month: number, year: number): number {
  if (year > 2026) return decTarget;
  if (year < 2026) return Math.round(decTarget * 0.05);
  const scale = MONTHLY_SCALE[month] ?? 1.0;
  return Math.round(decTarget * scale);
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Start/end of current month for filtering
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    const [
      cvTotal, cvPaid, cvPaidMonth,
      personalityTotal, personalityPaid, personalityPaidMonth,
      annoncesPaidMonth,
      candidatesTotal,
    ] = await Promise.all([
      db.collection("cvcheckusages").countDocuments(),
      db.collection("cvcheckusages").countDocuments({ paid: true }),
      db.collection("cvcheckusages").countDocuments({ paid: true, createdAt: { $gte: monthStart, $lt: monthEnd } }),
      db.collection("personalitytestusages").countDocuments(),
      db.collection("personalitytestusages").countDocuments({ paid: true }),
      db.collection("personalitytestusages").countDocuments({ paid: true, createdAt: { $gte: monthStart, $lt: monthEnd } }),
      db.collection("jobpayments").countDocuments({ status: "completed", createdAt: { $gte: monthStart, $lt: monthEnd } }),
      db.collection("candidates").countDocuments(),
    ]);

    const cvRevMonth = cvPaidMonth * 55;
    const personalityRevMonth = personalityPaidMonth * 50;
    const annoncesRevMonth = annoncesPaidMonth * 990;
    const totalRevMonth = cvRevMonth + personalityRevMonth + annoncesRevMonth;

    const cvTarget = monthlyTarget(DEC_TARGETS.cv, month, year);
    const personalityTarget = monthlyTarget(DEC_TARGETS.personality, month, year);
    const annoncesTarget = monthlyTarget(DEC_TARGETS.annonces, month, year);
    const servicesTarget = monthlyTarget(DEC_TARGETS.services, month, year);
    const totalTarget = cvTarget + personalityTarget + annoncesTarget + servicesTarget;

    const progress = Math.min(100, Math.round((totalRevMonth / totalTarget) * 100));

    return NextResponse.json({
      cv: { total: cvTotal, paid: cvPaid, paidThisMonth: cvPaidMonth, revenue: cvRevMonth, target: cvTarget },
      personality: { total: personalityTotal, paid: personalityPaid, paidThisMonth: personalityPaidMonth, revenue: personalityRevMonth, target: personalityTarget },
      annonces: { paidThisMonth: annoncesPaidMonth, revenue: annoncesRevMonth, target: annoncesTarget },
      services: { revenue: 0, target: servicesTarget },
      candidates: candidatesTotal,
      revenue: {
        mad: totalRevMonth,
        target: totalTarget,
        progress,
        decemberTarget: Object.values(DEC_TARGETS).reduce((a, b) => a + b, 0),
      },
    });
  } catch (err: any) {
    console.error("stats GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
