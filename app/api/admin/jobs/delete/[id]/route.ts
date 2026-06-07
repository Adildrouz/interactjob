import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const JOBS_PATH = path.join(process.cwd(), "data/jobs.json");

function verifyAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const raw = await fs.readFile(JOBS_PATH, "utf-8");
    const jobs: any[] = JSON.parse(raw);
    const before = jobs.length;
    const filtered = jobs.filter(j => j.id !== params.id && j.slug !== params.id);

    if (filtered.length === before) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    await fs.writeFile(JOBS_PATH, JSON.stringify(filtered, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
