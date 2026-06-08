import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { promises as fs } from "fs";
import path from "path";

const JOBS_PATH = path.join(process.cwd(), "data/jobs.json");

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

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd   = new Date(year, month, 1);
  // For today (ISO string range, for collections using string dates)
  const todayStart = new Date(year, month - 1, now.getDate());
  const todayEnd   = new Date(year, month - 1, now.getDate() + 1);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    const [
      cvTotal, cvMonth,
      personalityFree, personalityFreeMonth,
      personalityPaid, personalityPaidMonth,
      annoncesPaidMonth,
      candidatesTotal,
    ] = await Promise.all([
      // CV checker — all checks are free (no paid tier in schema)
      db.collection("cvcheckusages").countDocuments(),
      db.collection("cvcheckusages").countDocuments({
        checkedAt: { $gte: monthStart.toISOString(), $lt: monthEnd.toISOString() },
      }),
      // Personality — free (isPremium: false or absent)
      db.collection("personality_assessments").countDocuments({ isPremium: { $ne: true } }),
      db.collection("personality_assessments").countDocuments({
        isPremium: { $ne: true },
        createdAt: { $gte: monthStart, $lt: monthEnd },
      }),
      // Personality — paid (isPremium: true)
      db.collection("personality_assessments").countDocuments({ isPremium: true }),
      db.collection("personality_assessments").countDocuments({
        isPremium: true,
        createdAt: { $gte: monthStart, $lt: monthEnd },
      }),
      // Annonces payantes
      db.collection("jobpayments").countDocuments({ status: "completed", createdAt: { $gte: monthStart, $lt: monthEnd } }),
      db.collection("candidates").countDocuments(),
    ]);

    // Jobs RSS vs Employer from jobs.json
    let jobsTotal = 0, jobsRSS = 0, jobsEmployer = 0;
    try {
      const raw  = await fs.readFile(JOBS_PATH, "utf-8");
      const jobs = JSON.parse(raw) as Array<{ sponsored?: boolean; featured?: boolean; source?: string }>;
      jobsTotal    = jobs.length;
      jobsEmployer = jobs.filter(j => j.sponsored || j.featured).length;
      jobsRSS      = jobsTotal - jobsEmployer;
    } catch { /* jobs.json unavailable */ }

    const personalityTotal = personalityFree + personalityPaid;
    const cvRevMonth        = 0; // CV check is free; paid CV builder tracked separately
    const personalityRevMonth = personalityPaidMonth * 49;
    const annoncesRevMonth    = annoncesPaidMonth * 990;
    const totalRevMonth       = cvRevMonth + personalityRevMonth + annoncesRevMonth;

    const cvTarget          = monthlyTarget(DEC_TARGETS.cv, month, year);
    const personalityTarget = monthlyTarget(DEC_TARGETS.personality, month, year);
    const annoncesTarget    = monthlyTarget(DEC_TARGETS.annonces, month, year);
    const servicesTarget    = monthlyTarget(DEC_TARGETS.services, month, year);
    const totalTarget       = cvTarget + personalityTarget + annoncesTarget + servicesTarget;
    const progress          = Math.min(100, Math.round((totalRevMonth / totalTarget) * 100));

    return NextResponse.json({
      cv: { total: cvTotal, free: cvTotal, month: cvMonth, revenue: cvRevMonth, target: cvTarget },
      personality: {
        total: personalityTotal,
        free: personalityFree, freeThisMonth: personalityFreeMonth,
        paid: personalityPaid, paidThisMonth: personalityPaidMonth,
        revenue: personalityRevMonth, target: personalityTarget,
      },
      annonces: { paidThisMonth: annoncesPaidMonth, revenue: annoncesRevMonth, target: annoncesTarget },
      services: { revenue: 0, target: servicesTarget },
      candidates: candidatesTotal,
      jobs: { total: jobsTotal, rss: jobsRSS, employer: jobsEmployer },
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
