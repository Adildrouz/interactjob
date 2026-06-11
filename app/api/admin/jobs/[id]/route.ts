import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { promises as fs } from "fs";
import path from "path";

const JOBS_PATH = path.join(process.cwd(), "data/jobs.json");

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const { id } = await params;

  let jobs: any[] = [];
  try { jobs = JSON.parse(await fs.readFile(JOBS_PATH, "utf-8")); } catch {}
  const job = jobs.find(j => j.id === id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const todayStr = new Date().toISOString().slice(0, 10);
  const last7: string[] = [];
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 6; i >= 0; i--) {
    last7.push(new Date(dayStart.getTime() - i * 86400000).toISOString().slice(0, 10));
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    const jobSlugPattern = job.slug ? `/${job.slug}` : null;

    const [viewDoc, applications, viewsToday, viewsSparkline] = await Promise.all([
      db.collection("jobviews").findOne({ job_id: id }),
      db.collection("applications")
        .find({ job_id: id })
        .sort({ created_at: -1 })
        .toArray(),
      // Views today from page_views (URL-based)
      jobSlugPattern
        ? db.collection("page_views").aggregate([
            { $match: { url: { $regex: jobSlugPattern }, date: todayStr } },
            { $group: { _id: null, total: { $sum: "$count" } } },
          ]).toArray().then(r => r[0]?.total || 0)
        : Promise.resolve(0),
      // Views sparkline last 7d from page_views
      jobSlugPattern
        ? db.collection("page_views").aggregate([
            { $match: { url: { $regex: jobSlugPattern }, date: { $in: last7 } } },
            { $group: { _id: "$date", views: { $sum: "$count" } } },
            { $sort: { _id: 1 } },
          ]).toArray()
        : Promise.resolve([]),
    ]);

    const sparklineMap: Record<string, number> = Object.fromEntries(
      (viewsSparkline as any[]).map((d: any) => [d._id, d.views])
    );
    const sparkline = last7.map(d => ({ date: d, views: sparklineMap[d] || 0 }));

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        city: job.city,
        slug: job.slug,
        postedAt: job.postedAt || job.submittedAt,
        sponsored: !!job.sponsored || !!job.featured,
        contactEmail: job.contactEmail || job.applicantEmail || null,
        sector: job.sector,
        contractType: job.contractType,
      },
      stats: {
        viewsTotal: viewDoc?.views || 0,
        viewsToday: viewsToday as number,
        sparkline,
        applicationsTotal: applications.length,
        lastApplication: applications[0]?.created_at || null,
      },
      applications: applications.map((a: any) => ({
        id: a.id || a._id?.toString(),
        applicantName: a.applicant_name || "—",
        applicantEmail: a.applicant_email
          ? a.applicant_email.replace(/(?<=.{2}).(?=.*@)/g, "*")
          : "—",
        applicantEmailFull: a.applicant_email || "",
        coverLetter: a.cover_letter || null,
        cvUrl: a.cv_url || null,
        status: a.status || "recue",
        createdAt: a.created_at,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}

// PATCH — update application status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const { id: jobId } = await params;
  const { applicationId, status } = await req.json();
  const VALID = ["recue", "vue", "refusee", "acceptee"];
  if (!applicationId || !VALID.includes(status)) {
    return NextResponse.json({ error: "applicationId + status requis" }, { status: 400 });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");
    await db.collection("applications").updateOne(
      { id: applicationId, job_id: jobId },
      { $set: { status, viewed_at: status === "vue" ? new Date() : undefined } }
    );
    return NextResponse.json({ ok: true });
  } finally {
    await client.close();
  }
}
