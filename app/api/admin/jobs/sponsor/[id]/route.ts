import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const JOBS_PATH = path.join(process.cwd(), "data/jobs.json");

function verifyAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const raw = await fs.readFile(JOBS_PATH, "utf-8");
    const jobs: any[] = JSON.parse(raw);
    const idx = jobs.findIndex(j => j.id === params.id || j.slug === params.id);

    if (idx === -1) return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    jobs[idx] = { ...jobs[idx], sponsored: true, featured: true, sponsoredAt: new Date().toISOString(), sponsoredUntil: expiresAt };

    await fs.writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf-8");
    return NextResponse.json({ success: true, sponsoredUntil: expiresAt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
