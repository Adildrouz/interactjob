import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  githubConfigured,
  readJsonFromGithub,
  commitJsonFilesToGithub,
} from "@/lib/github-data";

const PENDING_REL = "data/pending-jobs.json";
const PENDING_PATH = path.join(process.cwd(), PENDING_REL);

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

    const useGithub = githubConfigured();

    // Read current pending jobs — from GitHub (prod) or local disk (dev)
    let pendingJobs = [];
    try {
      if (useGithub) {
        pendingJobs = await readJsonFromGithub<unknown[]>(PENDING_REL);
      } else {
        const data = await fs.readFile(PENDING_PATH, "utf-8");
        pendingJobs = JSON.parse(data);
      }
      if (!Array.isArray(pendingJobs)) pendingJobs = [];
    } catch {
      // File doesn't exist yet, start with empty array
      pendingJobs = [];
    }

    // Add new job
    pendingJobs.push(newJob);

    // Persist (GitHub commit in prod, disk in dev)
    if (useGithub) {
      const sha = await commitJsonFilesToGithub(
        [{ path: PENDING_REL, data: pendingJobs }],
        `chore(submit): new pending job "${newJob.title}" — ${company.trim()}`
      );
      console.log(`✓ Job submitted (GitHub ${sha.slice(0, 7)}): ${title} from ${company}`);
    } else {
      await fs.writeFile(
        PENDING_PATH,
        JSON.stringify(pendingJobs, null, 2),
        "utf-8"
      );
      console.log(`✓ Job submitted: ${title} from ${company}`);
    }

    return NextResponse.json({ success: true, job: newJob }, { status: 201 });
  } catch (error) {
    console.error("Job submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit job" },
      { status: 500 }
    );
  }
}
