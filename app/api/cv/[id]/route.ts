import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CandidateCV } from "@/lib/models/CandidateCV";

// CVs contain personal data — only the authenticated admin may fetch them.
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

  try {
    await connectDB();
    const cv = await CandidateCV.findOne({ candidateId: id }).lean<{
      filename: string;
      contentType: string;
      data: Buffer;
    }>();

    if (!cv || !cv.data) {
      return NextResponse.json({ error: "CV introuvable" }, { status: 404 });
    }

    // Mongoose returns a BSON Binary; normalize to a Node Buffer.
    const buf: Buffer = Buffer.isBuffer(cv.data)
      ? cv.data
      : Buffer.from((cv.data as { buffer?: ArrayBuffer }).buffer ?? cv.data);

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": cv.contentType || "application/pdf",
        "Content-Disposition": `inline; filename="${cv.filename || "cv.pdf"}"`,
        "Content-Length": String(buf.length),
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[cv] Failed to fetch CV:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
