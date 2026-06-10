import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";

/**
 * POST /api/apply — log every job application submitted via interactjob.ma.
 * Body (JSON): { jobId, jobTitle, company, applicantEmail, applicantName, cvUrl?, coverLetter? }
 */
export async function POST(req: NextRequest) {
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { jobId, jobTitle, company, applicantEmail, applicantName, cvUrl, coverLetter } = body || {};
  if (!jobId || !applicantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
    return NextResponse.json({ error: "jobId et applicantEmail valide requis" }, { status: 400 });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    const application = {
      id: randomUUID(),
      job_id: String(jobId),
      job_title: String(jobTitle || ""),
      company: String(company || ""),
      applicant_email: String(applicantEmail).toLowerCase().trim(),
      applicant_name: String(applicantName || "").trim(),
      cv_url: cvUrl ? String(cvUrl) : null,
      cover_letter: coverLetter ? String(coverLetter).slice(0, 5000) : null,
      status: "recue", // recue | vue | refusee | acceptee
      created_at: new Date(),
      viewed_at: null as Date | null,
    };

    await db.collection("applications").insertOne(application);
    return NextResponse.json({ ok: true, id: application.id }, { status: 201 });
  } catch (err: any) {
    console.error("apply POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
