import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EmployerInboundLead } from "@/lib/models/EmployerInboundLead";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  await connectDB();
  const leads = await EmployerInboundLead.find().sort({ created_at: -1 }).limit(200).lean();
  return NextResponse.json({ leads });
}

export async function PATCH(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id, status } = await req.json();
  if (!id || !["new", "contacted", "converted", "closed"].includes(status)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  await connectDB();
  await EmployerInboundLead.updateOne({ _id: id }, { $set: { status } });
  return NextResponse.json({ success: true });
}
