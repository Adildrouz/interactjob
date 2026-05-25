import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Candidate, type ICandidate } from "@/lib/models/Candidate";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const updates = await req.json();

  try {
    await connectDB();

    // Only allow specific fields to be updated
    const allowed = ["status", "notes", "starred", "viewed", "tags"];
    const cleanUpdates: Record<string, unknown> = {};

    allowed.forEach(key => {
      if (key in updates) cleanUpdates[key] = updates[key];
    });

    const candidate = await Candidate.findOneAndUpdate(
      { id },
      cleanUpdates,
      { new: true }
    );

    if (!candidate) return NextResponse.json({ error: "Candidat introuvable" }, { status: 404 });

    return NextResponse.json({ candidate });
  } catch (err) {
    console.error("Failed to update candidate:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
