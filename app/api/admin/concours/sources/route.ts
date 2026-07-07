import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ConcoursModel from "@/models/Concours";

function checkAuth(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  return session?.value === "authenticated";
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const stats = await ConcoursModel.aggregate([
    {
      $group: {
        _id: "$source",
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        expired: { $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] } },
        lastScrapedAt: { $max: "$scraped_at" },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const sources = stats.map((s) => ({
    source: s._id as string,
    total: s.total as number,
    active: s.active as number,
    expired: s.expired as number,
    lastScrapedAt: s.lastScrapedAt as Date | null,
  }));

  return NextResponse.json({ sources });
}
