import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Candidate } from "@/app/api/candidates/submit/route";

const CANDIDATES_FILE = path.join(process.cwd(), "data", "candidates.json");

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

function escapeCsv(val: string | number | boolean | null | undefined): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let candidates: Candidate[] = [];
  try { candidates = JSON.parse(await fs.readFile(CANDIDATES_FILE, "utf-8")); }
  catch { candidates = []; }

  const headers = ["ID","Prénom","Nom","Email","Téléphone","Ville","Secteurs","Poste","Expérience","Disponibilité","Langues","LinkedIn","Statut","Date soumission","Favori","Vu"];
  const rows = candidates.map(c => [
    c.id, c.firstName, c.lastName, c.email, c.phone, c.city,
    c.sectors.join("; "), c.position, c.experienceLevel, c.availability,
    c.languages.join("; "), c.linkedin, c.status,
    new Date(c.submittedAt).toLocaleDateString("fr-FR"),
    c.starred ? "Oui" : "Non",
    c.viewed ? "Oui" : "Non",
  ].map(escapeCsv).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const date = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="candidats-interactjob-${date}.csv"`,
    },
  });
}
