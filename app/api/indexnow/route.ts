import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = "3a8b1c2d4e5f6a7b";
const BASE_URL     = "https://www.interactjob.ma";

export async function POST(req: NextRequest) {
  const { urls } = await req.json() as { urls: string[] };

  if (!urls?.length) {
    return NextResponse.json({ error: "urls required" }, { status: 400 });
  }

  const body = {
    host:        "www.interactjob.ma",
    key:         INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList:     urls,
  };

  const [bing, yandex] = await Promise.allSettled([
    fetch("https://www.bing.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    }),
    fetch("https://yandex.com/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    }),
  ]);

  return NextResponse.json({
    submitted: urls,
    bing:   bing.status   === "fulfilled" ? bing.value.status   : "error",
    yandex: yandex.status === "fulfilled" ? yandex.value.status : "error",
  });
}
