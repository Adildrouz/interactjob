import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { githubConfigured, readJsonFromGithub } from "@/lib/github-data";
import { publicationRequests } from '@/lib/publication-requests';

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
    let warning = '';
    let jobs: { id: string; status?: string }[];
    try {
      jobs = githubConfigured()
        ? await readJsonFromGithub("data/pending-jobs.json")
        : JSON.parse(await fs.readFile(DATA_PATH, "utf-8"));
    } catch {
      // The deployed snapshot still contains legacy requests. New requests
      // remain available in Mongo even if GitHub becomes unreachable.
      jobs = JSON.parse(await fs.readFile(DATA_PATH, 'utf-8'));
      warning = 'La synchronisation des anciennes demandes est indisponible. Les nouveaux dépôts restent enregistrés ; vérifiez la synchronisation avant validation.';
    }
    if (!Array.isArray(jobs)) throw new Error("Invalid pending jobs data");
    const merged = new Map(jobs.map(job => [job.id, job]));
    if (process.env.MONGODB_URI) {
      for (const job of await publicationRequests()) {
        if (job.status === 'pending') merged.set(job.id, job);
        else merged.delete(job.id);
      }
    }
    return NextResponse.json({ jobs: [...merged.values()], warning }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to load publication requests", error);
    return NextResponse.json({ error: "Impossible de charger les demandes. Réessayez." }, { status: 503 });
  }
}
