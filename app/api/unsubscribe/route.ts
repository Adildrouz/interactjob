import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";
  if (!email || !email.includes("@")) {
    return new NextResponse("Email invalide.", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) return new NextResponse("Erreur serveur.", { status: 500 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    await client.db("interactjob").collection("employers").updateOne(
      { email: email.toLowerCase() },
      { $set: { status: "unsubscribed" } }
    );
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:40px;text-align:center">
      <h2>Désinscription confirmée</h2>
      <p>L'adresse <strong>${email}</strong> ne recevra plus d'emails d'InteractJob.ma.</p>
      </body></html>`,
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } finally {
    await client.close();
  }
}
