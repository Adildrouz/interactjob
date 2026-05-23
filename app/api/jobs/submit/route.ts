import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const PENDING_PATH = path.join(process.cwd(), "data/pending-jobs.json");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      company,
      city,
      sector,
      contractType,
      description,
      requirements,
      salary,
      contactEmail,
      featured,
    } = body;

    // Validate required fields
    if (
      !title?.trim() ||
      !company?.trim() ||
      !city ||
      !sector ||
      !contractType ||
      !description?.trim() ||
      !requirements?.trim() ||
      !contactEmail?.includes("@")
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create job object
    const newJob = {
      id: randomUUID(),
      title: title.trim(),
      company: company.trim(),
      city,
      sector,
      contractType,
      description: description.trim(),
      requirements: requirements.trim(),
      salary: salary?.trim() || null,
      featured: featured || false,
      applicantEmail: contactEmail.trim(),
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    // Read current pending jobs
    let pendingJobs = [];
    try {
      const data = await fs.readFile(PENDING_PATH, "utf-8");
      pendingJobs = JSON.parse(data);
    } catch {
      // File doesn't exist yet, start with empty array
      pendingJobs = [];
    }

    // Add new job
    pendingJobs.push(newJob);

    // Write updated pending jobs
    await fs.writeFile(
      PENDING_PATH,
      JSON.stringify(pendingJobs, null, 2),
      "utf-8"
    );

    console.log(`✓ Job submitted: ${title} from ${company}`);

    return NextResponse.json({ success: true, job: newJob }, { status: 201 });
  } catch (error) {
    console.error("Job submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit job" },
      { status: 500 }
    );
  }
}
