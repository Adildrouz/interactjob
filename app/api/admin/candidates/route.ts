import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Candidate, type ICandidate } from "@/lib/models/Candidate";

function verifyAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

async function readCandidates(): Promise<ICandidate[]> {
  try {
    await connectDB();
    const candidates = await Candidate.find({}).sort({ submittedAt: -1 }).lean();
    return candidates as ICandidate[];
  } catch (err) {
    console.error("Failed to fetch candidates from MongoDB:", err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search    = searchParams.get("search")?.toLowerCase() || "";
  const city      = searchParams.get("city")    || "";
  const sector    = searchParams.get("sector")  || "";
  const status    = searchParams.get("status")  || "";
  const exp       = searchParams.get("exp")     || "";
  const dispo     = searchParams.get("dispo")   || "";
  const starred   = searchParams.get("starred") === "true";
  const unviewed  = searchParams.get("unviewed") === "true";

  let candidates = await readCandidates();

  if (search)   candidates = candidates.filter(c => `${c.firstName} ${c.lastName} ${c.email} ${c.position}`.toLowerCase().includes(search));
  if (city)     candidates = candidates.filter(c => c.city === city);
  if (sector)   candidates = candidates.filter(c => c.sectors.includes(sector));
  if (status)   candidates = candidates.filter(c => c.status === status);
  if (exp)      candidates = candidates.filter(c => c.experienceLevel === exp);
  if (dispo)    candidates = candidates.filter(c => c.availability === dispo);
  if (starred)  candidates = candidates.filter(c => c.starred);
  if (unviewed) candidates = candidates.filter(c => !c.viewed);

  // Sort newest first
  candidates = candidates.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  return NextResponse.json({ candidates });
}
