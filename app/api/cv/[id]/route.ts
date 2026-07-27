import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { getEmployerSessionFromRequest } from "@/lib/employer/auth";
import { connectEmployerDB } from "@/lib/employer/db";
import { EmployerApplication } from "@/lib/models/EmployerApplication";

function isAdmin(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

/** An employer may download a CV only if it belongs to an application on one of their own offers. */
async function employerOwnsCv(req: NextRequest, cvId: string): Promise<boolean> {
  const session = await getEmployerSessionFromRequest(req);
  if (!session) return false;
  await connectEmployerDB();
  const owns = await EmployerApplication.exists({
    employer_id: session.id,
    cv_url: `/api/cv/${cvId}`,
  });
  return !!owns;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isAdmin(req) && !(await employerOwnsCv(req, id))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("interactjob");

    const cv = await db.collection("candidatecvs").findOne({ candidateId: id });

    if (!cv || !cv.data) {
      return NextResponse.json({ error: "CV introuvable" }, { status: 404 });
    }

    // BSON Binary → Node Buffer
    const raw = cv.data;
    const buf: Buffer = Buffer.isBuffer(raw)
      ? raw
      : raw?.buffer
        ? Buffer.from(raw.buffer)
        : Buffer.from(raw);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": cv.contentType || "application/pdf",
        "Content-Disposition": `inline; filename="${cv.filename || "cv.pdf"}"`,
        "Content-Length": String(buf.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err: any) {
    console.error("[cv] Failed to fetch CV:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
