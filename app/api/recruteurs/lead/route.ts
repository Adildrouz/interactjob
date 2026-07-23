import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EmployerInboundLead } from "@/lib/models/EmployerInboundLead";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { companyName, sector, sectorOther, email, message, locale, website } = await req.json();

    // Honeypot: bots fill the hidden "website" field
    if (website) return NextResponse.json({ success: true });

    if (!companyName?.trim() || !email?.trim() || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json(
        { error: "Nom d'entreprise et email valide requis" },
        { status: 400 }
      );
    }

    await connectDB();
    await EmployerInboundLead.create({
      company_name: companyName.trim().slice(0, 200),
      sector: (sector || "").slice(0, 100),
      sector_other: sector === "Autre" ? (sectorOther || "").trim().slice(0, 200) : "",
      email: email.trim().toLowerCase(),
      message: (message || "").slice(0, 3000),
      locale: locale || "fr",
      status: "new",
      created_at: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[recruteurs/lead]", err);
    return NextResponse.json({ error: "Erreur serveur, réessayez." }, { status: 500 });
  }
}
