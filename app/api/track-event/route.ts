import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ToolEvent, type ToolName, type TestType } from "@/lib/models/ToolEvent";

export const dynamic = "force-dynamic";

const VALID_TOOLS: ToolName[] = ["cv_checker", "cv_builder", "personality_test"];
const VALID_TEST_TYPES: NonNullable<TestType>[] = ["mbti", "disc", "couleurs", "enneagramme", "professionnel"];

// Maps cf-ipcountry to the currency actually shown to that visitor — kept in
// sync with app/api/detect-currency/route.ts's country → currency mapping.
function currencyForCountry(country: string): string {
  if (country === "MA") return "MAD";
  if (country === "CH") return "CHF";
  return "EUR";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, tool, test_type, event, metadata } = body ?? {};

    if (typeof session_id !== "string" || !session_id) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (!VALID_TOOLS.includes(tool)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (typeof event !== "string" || !event) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (test_type != null && !VALID_TEST_TYPES.includes(test_type)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const country = (req.headers.get("cf-ipcountry") || "").toUpperCase() || null;
    const referrer = req.headers.get("referer") || null;

    await connectDB();
    await ToolEvent.create({
      session_id,
      tool,
      test_type: test_type ?? null,
      event,
      // Metadata is arbitrary client-supplied context — never trust it as PII-free
      // input on faith, but this endpoint is not expected to receive PII by design
      // (no name/email/CV-content fields exist anywhere in the tracking calls).
      metadata: metadata && typeof metadata === "object" ? metadata : {},
      country,
      currency: country ? currencyForCountry(country) : null,
      referrer,
      created_at: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Fire-and-forget: tracking must never surface an error to the caller.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
