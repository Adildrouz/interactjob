import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Candidate } from "@/app/api/candidates/submit/route";

const CANDIDATES_FILE = path.join(process.cwd(), "data", "candidates.json");

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

async function readCandidates(): Promise<Candidate[]> {
  try { return JSON.parse(await fs.readFile(CANDIDATES_FILE, "utf-8")); }
  catch { return []; }
}

async function writeCandidates(data: Candidate[]) {
  await fs.writeFile(CANDIDATES_FILE, JSON.stringify(data, null, 2));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const updates = await req.json();

  const candidates = await readCandidates();
  const idx = candidates.findIndex(c => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Candidat introuvable" }, { status: 404 });

  const allowed: (keyof Candidate)[] = ["status", "notes", "starred", "viewed", "tags"];
  allowed.forEach(key => {
    if (key in updates) (candidates[idx] as unknown as Record<string, unknown>)[key] = updates[key];
  });

  await writeCandidates(candidates);
  return NextResponse.json({ candidate: candidates[idx] });
}
