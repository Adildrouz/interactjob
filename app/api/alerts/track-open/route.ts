import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { ALERT_SUBSCRIBERS_COLLECTION } from "@/lib/alerts";
import { trackServerEvent } from "@/lib/trackServerEvent";

// 1x1 transparent GIF, served regardless of outcome — a tracking pixel must
// never break email rendering even if the subscriber id is missing/stale.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7",
  "base64"
);

function pixelResponse() {
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// GET /api/alerts/track-open?sid=<subscriber_id> — embedded as a 1x1 pixel
// in every alert digest email.
export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid") || "";
  const uri = process.env.MONGODB_URI;

  if (!sid || !uri) return pixelResponse();

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const { ObjectId } = await import("mongodb");
    let _id;
    try { _id = new ObjectId(sid); } catch { return pixelResponse(); }

    await client.db("interactjob").collection(ALERT_SUBSCRIBERS_COLLECTION).updateOne(
      { _id },
      { $set: { last_opened_at: new Date() } }
    );
    await trackServerEvent("email_alerts", "alert_email_opened", { subscriberId: sid });
  } catch (err) {
    console.error("track-open failed:", err);
  } finally {
    await client.close();
  }

  return pixelResponse();
}
