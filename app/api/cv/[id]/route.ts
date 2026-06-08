import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

function verifyAuth(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

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
