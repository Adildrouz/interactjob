import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { MongoClient } from "mongodb";

const JOBS_PATH = path.join(process.cwd(), "data/jobs.json");

function verifyAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const raw = await fs.readFile(JOBS_PATH, "utf-8");
    const jobs = JSON.parse(raw);

    // Enrich with views + applications from MongoDB
    const uri = process.env.MONGODB_URI;
    if (uri) {
      const client = new MongoClient(uri);
      try {
        await client.connect();
        const db = client.db("interactjob");

        const slugs: string[] = jobs.map((j: { slug?: string; id: string }) => j.slug || j.id);

        // Total views per slug from jobviews collection
        const viewAgg = await db.collection("jobviews").aggregate([
          { $match: { job_slug: { $in: slugs } } },
          { $group: { _id: "$job_slug", views: { $sum: 1 } } },
        ]).toArray();
        const viewMap: Record<string, number> = {};
        for (const v of viewAgg) viewMap[v._id] = v.views;

        // Also aggregate page_views for /offres/* URLs
        const pageViewAgg = await db.collection("page_views").aggregate([
          { $match: { url: { $regex: "^/offres/" } } },
          { $group: { _id: "$url", views: { $sum: "$count" } } },
        ]).toArray();
        for (const v of pageViewAgg) {
          const slug = v._id.replace(/^\/offres\/[^/]+\//, "").replace(/^\/offres\//, "");
          if (slug) viewMap[slug] = (viewMap[slug] || 0) + v.views;
        }

        // Candidatures count per job_id / job_slug
        const appAgg = await db.collection("applications").aggregate([
          { $match: { job_id: { $in: slugs } } },
          { $group: { _id: "$job_id", count: { $sum: 1 } } },
        ]).toArray();
        const appMap: Record<string, number> = {};
        for (const a of appAgg) appMap[a._id] = a.count;

        // Attach stats to each job
        for (const job of jobs) {
          const key = job.slug || job.id;
          job.views = viewMap[key] || 0;
          job.applications = appMap[key] || appMap[job.id] || 0;
        }
      } finally {
        await client.close();
      }
    }

    return NextResponse.json({ jobs, total: jobs.length });
  } catch {
    return NextResponse.json({ jobs: [], total: 0 });
  }
}
