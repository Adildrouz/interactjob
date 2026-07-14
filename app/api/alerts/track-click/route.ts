import { NextRequest, NextResponse } from "next/server";
import { trackServerEvent } from "@/lib/trackServerEvent";

const SITE_URL = "https://www.interactjob.ma";

// GET /api/alerts/track-click?sid=<subscriber_id>&url=<relative-or-absolute-target>
// Wraps every offer/concours link inside an alert digest email so a click
// is recorded before redirecting through to the actual page.
export async function GET(req: NextRequest) {
  const sid = req.nextUrl.searchParams.get("sid") || "";
  const target = req.nextUrl.searchParams.get("url") || "/";

  // Only ever redirect within our own site — never let this become an open redirect.
  const safeTarget = target.startsWith("/") ? `${SITE_URL}${target}` : SITE_URL;

  if (sid) {
    await trackServerEvent("email_alerts", "alert_email_clicked", { subscriberId: sid, metadata: { target } });
  }

  return NextResponse.redirect(safeTarget, { status: 302 });
}
