import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { promises as fs } from "fs";
import path from "path";

const JOBS_PATH = path.join(process.cwd(), "data/jobs.json");

function verifyAuth(req: NextRequest) {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

/**
 * POST /api/admin/employers/seed
 * Extracts unique companies from jobs.json and inserts them as "prospect"
 * employers if not already in the collection (upsert by email).
 */
export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const uri = process.env.MONGODB_URI!;

  let jobs: any[] = [];
  try { jobs = JSON.parse(await fs.readFile(JOBS_PATH, "utf-8")); } catch {}

  // Only import employers from Direct jobs (not scraped aggregators)
  const directJobs = jobs.filter((j: any) => j.source === "Direct");

  // Build unique employer map by email
  const byEmail = new Map<string, any>();
  for (const j of directJobs) {
    const email = (j.contactEmail || "").trim().toLowerCase();
    if (!email || !email.includes("@")) continue;
    if (!byEmail.has(email)) {
      byEmail.set(email, {
        _id: new ObjectId(),
        company_name: j.company || "—",
        contact_name: "",
        email,
        phone: "",
        city: j.city || "",
        sector: j.sector || "",
        source: "direct",
        last_contacted: null,
        status: "prospect",
        notes: "",
        last_job_title: j.title || "",
        last_job_date: j.postedAt || j.submittedAt || "",
        created_at: new Date(),
      });
    }
  }

  if (byEmail.size === 0) return NextResponse.json({ inserted: 0, message: "Aucun email valide trouvé" });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const col = client.db("interactjob").collection("employers");

    // Create unique index on email (idempotent)
    await col.createIndex({ email: 1 }, { unique: true });

    let inserted = 0;
    for (const emp of byEmail.values()) {
      try {
        await col.insertOne(emp);
        inserted++;
      } catch {
        // Duplicate email — skip
      }
    }

    return NextResponse.json({ inserted, total: byEmail.size });
  } finally {
    await client.close();
  }
}
