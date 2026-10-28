import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { EmployerInboundLead } from "@/lib/models/EmployerInboundLead";
import { isValidObjectId } from "mongoose";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  await connectDB();
  const leads = await EmployerInboundLead.find().sort({ created_at: -1 }).limit(200).lean();
  return NextResponse.json({ leads }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const { id, status, notes } = body || {};
  if (!isValidObjectId(id) || (status !== undefined && !["new", "contacted", "converted", "closed"].includes(status)) ||
      (notes !== undefined && (typeof notes !== "string" || notes.length > 10000)) ||
      (status === undefined && notes === undefined)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }
  await connectDB();
  const update: { status?: string; notes?: string; contacted_at?: Date } = {};
  if (status) update.status = status;
  if (notes !== undefined) update.notes = notes;
  if (status === "contacted") update.contacted_at = new Date();
  const result = await EmployerInboundLead.updateOne({ _id: id }, { $set: update });
  if (!result.matchedCount) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  return NextResponse.json({ success: true });
}
