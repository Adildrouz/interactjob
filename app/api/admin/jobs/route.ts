import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { githubConfigured, readJsonFromGithub } from "@/lib/github-data";

const DATA_PATH = path.join(process.cwd(), "data/pending-jobs.json");

function checkAuth(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session || session.value !== "authenticated") {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = githubConfigured()
      ? await readJsonFromGithub<unknown[]>("data/pending-jobs.json")
      : JSON.parse(await fs.readFile(DATA_PATH, "utf-8"));
    if (!Array.isArray(jobs)) throw new Error("Invalid pending jobs data");
    return NextResponse.json({ jobs }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load publication requests", error);
    return NextResponse.json({ error: "Impossible de charger les demandes. Réessayez." }, { status: 503 });
  }
}
