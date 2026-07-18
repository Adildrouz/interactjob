import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import {
  githubConfigured,
  readJsonFromGithub,
  commitJsonFilesToGithub,
} from "@/lib/github-data";

const JOBS_REL = "data/jobs.json";
const JOBS_PATH = path.join(process.cwd(), JOBS_REL);

function checkAuth(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

/**
 * POST /api/admin/jobs/close/[id] — manually close a Direct offer
 * ("Poste pourvu"). Restricted to source === "Direct": scraped/RSS/remote
 * jobs already have their own expiry lifecycle and must not be touched
 * here. Sets expired:true + manually_closed:true (distinct from
 * auto-expiry, which no longer applies to Direct offers at all) so the
 * public offer page can show a "Poste pourvu" badge instead of the
 * generic "deadline passed" copy, and so agent/expirer.js's trim never
 * removes it — closed Direct offers keep their page for SEO.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const useGithub = githubConfigured();

  try {
    let jobs: any[] = [];
    if (useGithub) {
      jobs = await readJsonFromGithub<any[]>(JOBS_REL);
    } else {
      jobs = JSON.parse(await fs.readFile(JOBS_PATH, "utf-8"));
    }

    const idx = jobs.findIndex((j) => j.id === id);
    if (idx === -1) return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });

    const job = jobs[idx];
    if (job.source !== "Direct") {
      return NextResponse.json(
        { error: "Seules les offres Direct peuvent être clôturées manuellement ici." },
        { status: 400 }
      );
    }

    const closedAt = new Date().toISOString();
    jobs[idx] = {
      ...job,
      expired: true,
      manually_closed: true,
      closed_at: closedAt,
      schema: job.schema ? { ...job.schema, validThrough: closedAt.split("T")[0] } : job.schema,
    };

    if (useGithub) {
      await commitJsonFilesToGithub(
        [{ path: JOBS_REL, data: jobs }],
        `chore(admin): close job "${job.title}" — poste pourvu`
      );
    } else {
      await fs.writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf-8");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[admin/jobs/close]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
