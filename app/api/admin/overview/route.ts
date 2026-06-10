import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { promises as fs } from "fs";
import path from "path";

export const revalidate = 0; // auth route — no static caching; client refreshes
const JOBS_PATH = path.join(process.cwd(), "data/jobs.json");
const REMOTE_PATH = path.join(process.cwd(), "data/remote-jobs.json");
const TOKEN_PATH = path.join(process.cwd(), "data/token-usage.json");
const ARTICLES_PATH = path.join(process.cwd(), "data/articles.json");

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

// Feed registry — known state of agent RSS sources (agent/parser.js + remote-scraper.js)
const MOROCCO_FEEDS = ["Dreamjob.ma", "Emploi.ma"];
const REMOTE_FEEDS = [
  { name: "Himalayas", status: "ok" },
  { name: "RemoteOK", status: "ok" },
  { name: "WeWorkRemotely", status: "ok" },
  { name: "Remotive", status: "warn", reason: "Feeds catégories seulement (/feed global 404)" },
  { name: "WorkingNomads", status: "broken", reason: "404/timeout — retiré du scraper" },
  { name: "Remote.co", status: "broken", reason: "404/timeout — retiré du scraper" },
];

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart.getTime() - 6 * 86400000);
  const prevWeekStart = new Date(dayStart.getTime() - 13 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // ── Local JSON data ─────────────────────────────────────────────────────────
  let jobs: any[] = [];
  let remote: any[] = [];
  let tokenUsage: any = {};
  let articles: any[] = [];
  try { jobs = JSON.parse(await fs.readFile(JOBS_PATH, "utf-8")); } catch {}
  try { remote = JSON.parse(await fs.readFile(REMOTE_PATH, "utf-8")); } catch {}
  try { tokenUsage = JSON.parse(await fs.readFile(TOKEN_PATH, "utf-8")); } catch {}
  try { articles = JSON.parse(await fs.readFile(ARTICLES_PATH, "utf-8")); } catch {}

  const active = jobs.filter(j => !j.expired);
  const direct = active.filter(j => j.source === "Direct");
  const scraped = jobs.filter(j => j.source !== "Direct");

  // Per-source stats (Morocco scraped feeds)
  const sources = MOROCCO_FEEDS.map(name => {
    const all = jobs.filter(j => (j.source_site || j.source) === name);
    const lastSync = all.reduce((m, j) => {
      const d = j.date_scraped || j.postedAt || "";
      return d > m ? d : m;
    }, "");
    return {
      name,
      total: all.length,
      active: all.filter(j => !j.expired).length,
      expired: all.filter(j => j.expired).length,
      lastSync,
      status: lastSync && (Date.now() - new Date(lastSync).getTime()) < 3 * 86400000 ? "ok" : "warn",
    };
  });

  // Enrichment stats
  const enriched = active.filter(j => j.hr_commentary && j.hr_commentary.length > 100);
  const lastEnrichDate = jobs.reduce((m, j) => {
    const d = j.date_scraped || "";
    return j.hr_commentary && d > m ? d : m;
  }, "");

  // Remote per-source
  const remoteSources: Record<string, number> = {};
  let remoteLastSync = "";
  for (const r of remote) {
    const s = r.source || "?";
    remoteSources[s] = (remoteSources[s] || 0) + 1;
    if ((r.scrapedAt || "") > remoteLastSync) remoteLastSync = r.scrapedAt;
  }

  // New jobs trends (7d vs previous 7d)
  const dStr = (d: Date) => d.toISOString().slice(0, 10);
  const inRange = (j: any, from: Date, to: Date) => {
    const d = (j.date_scraped || j.postedAt || "").slice(0, 10);
    return d >= dStr(from) && d < dStr(to);
  };
  const jobsLast7 = jobs.filter(j => inRange(j, weekStart, new Date(dayStart.getTime() + 86400000))).length;
  const jobsPrev7 = jobs.filter(j => inRange(j, prevWeekStart, weekStart)).length;

  // ── MongoDB data ────────────────────────────────────────────────────────────
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");
    const apps = db.collection("applications");
    const candidates = db.collection("candidates");

    const [
      appsTotal, appsWeek, appsPrevWeek, appsToday, appsMonth,
      candidatesTotal, candidatesWeek, candidatesPrevWeek,
      paymentsMonth, paymentsHistory,
      personalityPaidMonth,
      employersMonth,
    ] = await Promise.all([
      apps.countDocuments(),
      apps.countDocuments({ created_at: { $gte: weekStart } }),
      apps.countDocuments({ created_at: { $gte: prevWeekStart, $lt: weekStart } }),
      apps.countDocuments({ created_at: { $gte: dayStart } }),
      apps.countDocuments({ created_at: { $gte: monthStart } }),
      candidates.countDocuments(),
      candidates.countDocuments({ submittedAt: { $gte: weekStart.toISOString() } }),
      candidates.countDocuments({ submittedAt: { $gte: prevWeekStart.toISOString(), $lt: weekStart.toISOString() } }),
      db.collection("jobpayments").find({ status: "completed", createdAt: { $gte: monthStart } }).toArray(),
      db.collection("jobpayments").aggregate([
        { $match: { status: "completed" } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          total: { $sum: { $ifNull: ["$amount", 990] } },
          count: { $sum: 1 },
        } },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]).toArray(),
      db.collection("personality_assessments").countDocuments({ isPremium: true, createdAt: { $gte: monthStart } }),
      // New employers this month = distinct companies among Direct jobs submitted this month
      Promise.resolve(
        jobs.filter(j => j.source === "Direct" && (j.submittedAt || j.postedAt || "") >= monthStart.toISOString())
          .reduce((set: Set<string>, j: any) => set.add(j.company), new Set<string>()).size
      ),
    ]);

    // Revenue
    const annoncesRev = paymentsMonth.reduce((s: number, p: any) => s + (p.amount || 990), 0);
    const personalityRev = personalityPaidMonth * 49;
    const revenueMonth = annoncesRev + personalityRev;
    const revenueHistory = paymentsHistory.map((h: any) => ({ month: h._id, mad: h.total, count: h.count }));

    // Top applied jobs
    const topJobs = await apps.aggregate([
      { $group: { _id: { job: "$job_title", company: "$company" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]).toArray();

    // Per-job views + applications for direct job listings
    const directIds = direct.map(j => j.id);
    const [viewDocs, appCounts] = await Promise.all([
      db.collection("jobviews").find({ job_id: { $in: directIds } }).toArray(),
      apps.aggregate([
        { $match: { job_id: { $in: directIds } } },
        { $group: { _id: "$job_id", count: { $sum: 1 } } },
      ]).toArray(),
    ]);
    const viewsByJob: Record<string, number> = Object.fromEntries(viewDocs.map((v: any) => [v.job_id, v.views || 0]));
    const appsByJob: Record<string, number> = Object.fromEntries(appCounts.map((a: any) => [a._id, a.count]));

    return NextResponse.json({
      generatedAt: now.toISOString(),
      kpi: {
        activeJobs: active.length,
        applications: { total: appsTotal + candidatesTotal, week: appsWeek + candidatesWeek, prevWeek: appsPrevWeek + candidatesPrevWeek, today: appsToday },
        jobsNew: { week: jobsLast7, prevWeek: jobsPrev7 },
        employersMonth,
        appsMonth,
      },
      jobs: {
        sources,
        scraped: { total: scraped.length, active: scraped.filter(j => !j.expired).length, expired: scraped.filter(j => j.expired).length },
        direct: direct.map(j => ({
          id: j.id, title: j.title, company: j.company, city: j.city,
          postedAt: j.postedAt || j.submittedAt, sponsored: !!j.sponsored || !!j.featured,
          status: j.status || "published", slug: j.slug,
          views: viewsByJob[j.id] || 0,
          applications: appsByJob[j.id] || 0,
        })),
        enrichment: {
          done: enriched.length,
          total: active.length,
          lastRun: lastEnrichDate,
          estCostUSD: typeof tokenUsage.totalCost === "number" ? Math.round(tokenUsage.totalCost * 100) / 100 : null,
        },
      },
      remote: {
        total: remote.length,
        sources: remoteSources,
        feeds: REMOTE_FEEDS,
        lastSync: remoteLastSync,
      },
      seo: {
        indexableOffres: active.length,
        articles: articles.length,
        lastArticle: articles.reduce((m: string, a: any) => ((a.publishedAt || "") > m ? a.publishedAt : m), ""),
        codeTravail: 70,
        codeTravailFaq: true,
      },
      revenue: {
        month: revenueMonth,
        annonces: annoncesRev,
        personality: personalityRev,
        history: revenueHistory,
        target: 5848, // June 2026 target (12% of 48 730 December target)
      },
      topJobs: topJobs.map((t: any) => ({ job: t._id.job, company: t._id.company, count: t.count })),
    });
  } catch (err: any) {
    console.error("overview GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
