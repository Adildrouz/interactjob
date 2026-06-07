import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

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
    return NextResponse.json({ jobs, total: jobs.length });
  } catch {
    return NextResponse.json({ jobs: [], total: 0 });
  }
}
