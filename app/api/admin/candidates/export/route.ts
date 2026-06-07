import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

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

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const candidates = await client.db("interactjob").collection("candidates").find({}).sort({ submittedAt: -1 }).toArray();

    const headers = ["ID","Prénom","Nom","Email","Téléphone","Ville","Secteurs","Poste","Expérience","Disponibilité","Langues","LinkedIn","Statut","Date soumission","Favori","Vu"];
    const rows = candidates.map((c: any) => [
      c._id.toString(), c.firstName, c.lastName, c.email, c.phone, c.city,
      (c.sectors || []).join("; "), c.position, c.experienceLevel, c.availability,
      (c.languages || []).join("; "), c.linkedin, c.status,
      c.submittedAt ? new Date(c.submittedAt).toLocaleDateString("fr-FR") : "",
      c.starred ? "Oui" : "Non",
      c.viewed ? "Oui" : "Non",
    ].map(escapeCsv).join(","));

    const csv = "﻿" + [headers.join(","), ...rows].join("\n");
    const date = new Date().toISOString().split("T")[0];

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="candidats-interactjob-${date}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("export error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
