import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

/** GET /api/admin/applications — list + metrics. Filters: ?status=&job=&company= */
export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const job = url.searchParams.get("job");
  const company = url.searchParams.get("company");

  const filter: any = {};
  if (status) filter.status = status;
  if (job) filter.job_title = { $regex: job, $options: "i" };
  if (company) filter.company = { $regex: company, $options: "i" };

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db("interactjob").collection("applications");

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(dayStart.getTime() - 6 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [list, total, month, week, today, topJobs] = await Promise.all([
      col.find(filter).sort({ created_at: -1 }).limit(200).toArray(),
      col.countDocuments(),
      col.countDocuments({ created_at: { $gte: monthStart } }),
      col.countDocuments({ created_at: { $gte: weekStart } }),
      col.countDocuments({ created_at: { $gte: dayStart } }),
      col.aggregate([
        { $group: { _id: { job: "$job_title", company: "$company" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]).toArray(),
    ]);

    return NextResponse.json({
      applications: list.map(({ _id, ...rest }) => rest),
      metrics: { total, month, week, today },
      topJobs: topJobs.map(t => ({ job: t._id.job, company: t._id.company, count: t.count })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}

/** PATCH /api/admin/applications — update status. Body: { id, status } */
export async function PATCH(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const { id, status } = await req.json();
  if (!id || !["recue", "vue", "refusee", "acceptee"].includes(status)) {
    return NextResponse.json({ error: "id et status valide requis" }, { status: 400 });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const updates: any = { status };
    if (status === "vue") updates.viewed_at = new Date();
    const r = await client.db("interactjob").collection("applications")
      .updateOne({ id }, { $set: updates });
    if (r.matchedCount === 0) return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
