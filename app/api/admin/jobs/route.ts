import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data/pending-jobs.json");

function checkAuth(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session || session.value !== "authenticated") {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fs.readFile(DATA_PATH, "utf-8");
    const jobs = JSON.parse(data);
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ jobs: [] });
  }
}
