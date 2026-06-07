import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { SiteConfig } from "@/lib/models/SiteConfig";

const PAGES_WITH_STATS = ["/", "/a-propos", "/en/a-propos", "/ar/a-propos"];

function isAuthorized(secret: string) {
  return process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET;
}

// POST — used by the agent cron
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret") ?? "";
  if (!isAuthorized(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, value } = (await req.json()) as { key?: string; value?: string };
  if (!key || value === undefined) {
    return NextResponse.json({ error: "key and value are required" }, { status: 400 });
  }

  await connectDB();
  await SiteConfig.findOneAndUpdate(
    { key },
    { key, value, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  PAGES_WITH_STATS.forEach((p) => revalidatePath(p));

  return NextResponse.json({ ok: true, key, value, updatedAt: new Date().toISOString() });
}

// GET — bookmark-friendly for Adil's manual updates
// Usage: /api/admin/update-stat?secret=XXX&key=linkedin_followers&value=19+000+abonnés
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const secret = searchParams.get("secret") ?? "";
  if (!isAuthorized(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key   = searchParams.get("key") ?? "";
  const value = searchParams.get("value") ?? "";

  // If no value provided, just read the current value
  await connectDB();
  if (!value) {
    const cfg = await SiteConfig.findOne({ key }).lean() as { value: string; updatedAt: Date } | null;
    return NextResponse.json(cfg ?? { error: "Key not found" });
  }

  await SiteConfig.findOneAndUpdate(
    { key },
    { key, value, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  PAGES_WITH_STATS.forEach((p) => revalidatePath(p));

  return NextResponse.json({
    ok: true, key, value,
    updatedAt: new Date().toISOString(),
    message: `✅ ${key} mis à jour → "${value}"`,
  });
}
