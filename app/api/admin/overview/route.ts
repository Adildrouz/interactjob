import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { promises as fs } from "fs";
import path from "path";

export const revalidate = 0;
const JOBS_PATH = path.join(process.cwd(), "data/jobs.json");
const REMOTE_PATH = path.join(process.cwd(), "data/remote-jobs.json");
const TOKEN_PATH = path.join(process.cwd(), "data/token-usage.json");
const ARTICLES_PATH = path.join(process.cwd(), "data/articles.json");

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

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

  // Date filter via query param: today | 7j | 30j | all (default: all)
  const range = req.nextUrl.searchParams.get("range") || "all";

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart.getTime() - 6 * 86400000);
  const prevWeekStart = new Date(dayStart.getTime() - 13 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Last 7 days strings for page_views aggregation
  const last7Dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(dayStart.getTime() - i * 86400000);
    last7Dates.push(d.toISOString().slice(0, 10));
  }

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

  const enriched = active.filter(j => j.hr_commentary && j.hr_commentary.length > 100);
  const lastEnrichDate = jobs.reduce((m, j) => {
    const d = j.date_scraped || "";
    return j.hr_commentary && d > m ? d : m;
  }, "");

  const remoteSources: Record<string, number> = {};
  let remoteLastSync = "";
  for (const r of remote) {
    const s = r.source || "?";
    remoteSources[s] = (remoteSources[s] || 0) + 1;
    if ((r.scrapedAt || "") > remoteLastSync) remoteLastSync = r.scrapedAt;
  }

  const dStr = (d: Date) => d.toISOString().slice(0, 10);
  const inRange = (j: any, from: Date, to: Date) => {
    const d = (j.date_scraped || j.postedAt || "").slice(0, 10);
    return d >= dStr(from) && d < dStr(to);
  };
  const jobsLast7 = jobs.filter(j => inRange(j, weekStart, new Date(dayStart.getTime() + 86400000))).length;
  const jobsPrev7 = jobs.filter(j => inRange(j, prevWeekStart, weekStart)).length;

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
      // Page view stats
      visitorsToday,
      visitorsWeek,
      pageViewsOffresMonth,
      pageViewsSparkline,
      recentActivity,
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
      Promise.resolve(
        jobs.filter(j => j.source === "Direct" && (j.submittedAt || j.postedAt || "") >= monthStart.toISOString())
          .reduce((set: Set<string>, j: any) => set.add(j.company), new Set<string>()).size
      ),
      // Unique visitors today = distinct session_ids with date = today
      db.collection("visitor_days").countDocuments({ date: todayStr }),
      // Unique visitors last 7 days = distinct session_ids in last7Dates
      db.collection("visitor_days").aggregate([
        { $match: { date: { $in: last7Dates } } },
        { $group: { _id: "$session_id" } },
        { $count: "total" },
      ]).toArray().then(r => r[0]?.total || 0),
      // Page views on /offres/* this month
      db.collection("page_views").aggregate([
        { $match: { url: /^\/[a-z]{2}\/offres/, date: { $gte: monthStart.toISOString().slice(0, 10) } } },
        { $group: { _id: null, total: { $sum: "$count" } } },
      ]).toArray().then(r => r[0]?.total || 0),
      // Sparkline: visitors per day for last 7 days
      db.collection("visitor_days").aggregate([
        { $match: { date: { $in: last7Dates } } },
        { $group: { _id: "$date", visitors: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
      // Last 10 activity events: applications + direct job approvals
      apps.find({}, { projection: { job_title: 1, company: 1, created_at: 1, applicant_name: 1 } })
        .sort({ created_at: -1 }).limit(10).toArray(),
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

    // Per-job views + applications for direct listings
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

    // Sparkline map: fill missing dates with 0
    const sparklineMap: Record<string, number> = Object.fromEntries(
      (pageViewsSparkline as any[]).map((d: any) => [d._id, d.visitors])
    );
    const visitorsSparkline = last7Dates.map(d => ({ date: d, visitors: sparklineMap[d] || 0 }));

    // Conversion rate: (candidatures this month) / (offres page views this month) × 100
    const conversionRate = pageViewsOffresMonth > 0
      ? Math.round((appsMonth / pageViewsOffresMonth) * 10000) / 100
      : 0;

    return NextResponse.json({
      generatedAt: now.toISOString(),
      kpi: {
        activeJobs: active.length,
        applications: { total: appsTotal + candidatesTotal, week: appsWeek + candidatesWeek, prevWeek: appsPrevWeek + candidatesPrevWeek, today: appsToday },
        jobsNew: { week: jobsLast7, prevWeek: jobsPrev7 },
        employersMonth,
        appsMonth,
        visitors: {
          today: visitorsToday,
          week: visitorsWeek as number,
          sparkline: visitorsSparkline,
        },
        pageViewsOffresMonth,
        conversionRate,
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
          conversionRate: viewsByJob[j.id] > 0
            ? Math.round((appsByJob[j.id] || 0) / viewsByJob[j.id] * 10000) / 100
            : 0,
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
        target: 5848,
      },
      topJobs: topJobs.map((t: any) => ({ job: t._id.job, company: t._id.company, count: t.count })),
      recentActivity: (recentActivity as any[]).map((a: any) => ({
        type: "candidature",
        label: `Candidature — ${a.job_title || "?"}`,
        sub: a.company || "",
        at: a.created_at,
      })),
    });
  } catch (err: any) {
    console.error("overview GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
