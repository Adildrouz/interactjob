import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ToolEvent, type ToolName } from "@/lib/models/ToolEvent";

function verifyAuth(req: NextRequest): boolean {
  return req.cookies.get("admin_session")?.value === "authenticated";
}

// ── Funnel definitions (order matters — mirrors the mission's example tables) ──
const FUNNELS: Record<ToolName, { key: string; label: string }[]> = {
  cv_checker: [
    { key: "page_view", label: "Vues page" },
    { key: "upload_started", label: "Upload démarré" },
    { key: "upload_success", label: "Upload réussi" },
    { key: "analysis_completed", label: "Rapport généré" },
    { key: "cta_clicked", label: "CTA cliqué" },
  ],
  cv_builder: [
    { key: "page_view", label: "Vues page" },
    { key: "builder_started", label: "Formulaire démarré" },
    { key: "preview_generated", label: "Aperçu généré" },
    { key: "checkout_started", label: "Checkout démarré" },
    { key: "payment_attempted", label: "Paiement tenté" },
    { key: "payment_completed", label: "Paiement réussi" },
  ],
  personality_test: [
    { key: "page_view", label: "Vues page" },
    { key: "test_started", label: "Test démarré" },
    { key: "test_completed", label: "Test terminé" },
    { key: "result_viewed", label: "Résultat vu" },
    { key: "paid_report_cta_clicked", label: "CTA rapport payant" },
    { key: "payment_completed", label: "Paiement réussi" },
  ],
};

const FREE_USAGE_EVENT: Record<ToolName, string> = {
  cv_checker: "analysis_completed",
  cv_builder: "preview_generated",
  personality_test: "test_completed",
};

// Live event tracking (Phase 2 instrumentation) went live with this deploy —
// anything dated before it in the funnel is only present because it was
// backfilled from a source that already existed (page_views, cvcheckusages,
// personality_assessments). Interaction steps (uploads, checkout, abandons…)
// have no pre-deploy source and are genuinely zero before this date.
const LIVE_TRACKING_SINCE = "2026-07-11T13:27:36Z";

function rangeSince(range: string): Date | null {
  const now = Date.now();
  if (range === "today") {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  if (range === "7d") return new Date(now - 7 * 86400000);
  if (range === "30d") return new Date(now - 30 * 86400000);
  return null; // "all"
}

function buildMatch(tool: ToolName, since: Date | null, country: string | null, currency: string | null) {
  const match: Record<string, unknown> = { tool };
  if (since) match.created_at = { $gte: since };
  if (country) match.country = country;
  if (currency) match.currency = currency;
  return match;
}

// Simple in-process cache (60s) — this is an admin dashboard, not a public
// endpoint, so per-instance caching is sufficient to keep aggregations fast.
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; data: unknown }>();

async function computeToolFunnel(tool: ToolName, since: Date | null, country: string | null, currency: string | null) {
  const match = buildMatch(tool, since, country, currency);
  const steps = FUNNELS[tool];
  const stepKeys = steps.map((s) => s.key);

  const [stepCountsRaw, revenueRaw, failedPaymentsRaw] = await Promise.all([
    // Distinct-session count per funnel event (a session firing the same
    // event twice — e.g. two question_answered — must not inflate the funnel),
    // split by backfilled vs live so the dashboard can show both honestly.
    ToolEvent.aggregate([
      { $match: { ...match, event: { $in: stepKeys } } },
      { $group: { _id: { event: "$event", session: "$session_id", backfilled: { $ifNull: ["$metadata.backfilled", false] } } } },
      { $group: { _id: { event: "$_id.event", backfilled: "$_id.backfilled" }, count: { $sum: 1 } } },
    ]),
    ToolEvent.aggregate([
      { $match: { ...match, event: "payment_completed" } },
      {
        $group: {
          _id: { $ifNull: ["$metadata.currency", "$currency"] },
          total: { $sum: { $ifNull: ["$metadata.price", 0] } },
          count: { $sum: 1 },
        },
      },
    ]),
    ToolEvent.aggregate([
      { $match: { ...match, event: "payment_failed" } },
      { $group: { _id: { $ifNull: ["$metadata.error_reason", "unknown"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const countByEvent = new Map<string, number>();
  const backfilledByEvent = new Map<string, number>();
  for (const r of stepCountsRaw as { _id: { event: string; backfilled: boolean }; count: number }[]) {
    countByEvent.set(r._id.event, (countByEvent.get(r._id.event) || 0) + r.count);
    if (r._id.backfilled) backfilledByEvent.set(r._id.event, (backfilledByEvent.get(r._id.event) || 0) + r.count);
  }
  const firstCount = countByEvent.get(stepKeys[0]) || 0;

  const funnel = steps.map((s) => {
    const count = countByEvent.get(s.key) || 0;
    const backfilledCount = backfilledByEvent.get(s.key) || 0;
    return {
      step: s.key,
      label: s.label,
      count,
      backfilledCount,
      liveCount: count - backfilledCount,
      pct: firstCount > 0 ? Math.round((count / firstCount) * 1000) / 10 : 0,
    };
  });

  // Drop-off point: the step with the biggest percentage-point fall from the previous step.
  let dropOff: { from: string; to: string; dropPct: number } | null = null;
  for (let i = 1; i < funnel.length; i++) {
    const drop = funnel[i - 1].pct - funnel[i].pct;
    if (!dropOff || drop > dropOff.dropPct) {
      dropOff = { from: funnel[i - 1].label, to: funnel[i].label, dropPct: Math.round(drop * 10) / 10 };
    }
  }

  const views = firstCount;
  const freeUsage = countByEvent.get(FREE_USAGE_EVENT[tool]) || 0;
  const purchaseAttempts = countByEvent.get("checkout_started") || 0;
  const paymentsCompleted = countByEvent.get("payment_completed") || 0;
  const failedPaymentsTotal = failedPaymentsRaw.reduce((a: number, r: { count: number }) => a + r.count, 0);

  const revenueByCurrency = revenueRaw.map((r: { _id: string | null; total: number; count: number }) => ({
    currency: r._id || "N/A",
    total: Math.round(r.total * 100) / 100,
    count: r.count,
  }));
  const totalRevenue = revenueByCurrency.reduce((a, r) => a + r.total, 0);

  return {
    tool,
    funnel,
    metrics: {
      views,
      freeUsage,
      purchaseAttempts,
      paymentsCompleted,
      failedPayments: failedPaymentsTotal,
      failedPaymentReasons: failedPaymentsRaw.map((r: { _id: string; count: number }) => ({ reason: r._id, count: r.count })),
      conversionRate: views > 0 ? Math.round((paymentsCompleted / views) * 1000) / 10 : 0,
      dropOff,
    },
    revenue: { total: Math.round(totalRevenue * 100) / 100, byCurrency: revenueByCurrency, avgPerVisitor: views > 0 ? Math.round((totalRevenue / views) * 100) / 100 : 0 },
  };
}

async function computeFailureLog(since: Date | null, country: string | null, currency: string | null) {
  const match: Record<string, unknown> = { event: { $in: ["upload_failed", "payment_failed"] } };
  if (since) match.created_at = { $gte: since };
  if (country) match.country = country;
  if (currency) match.currency = currency;

  const docs = await ToolEvent.find(match, {
    tool: 1, test_type: 1, event: 1, metadata: 1, country: 1, currency: 1, created_at: 1,
  }).sort({ created_at: -1 }).limit(200).lean();

  return docs.map((d) => ({
    tool: d.tool,
    testType: d.test_type ?? null,
    event: d.event,
    reason: (d.metadata as Record<string, unknown> | undefined)?.error_reason ?? (d.metadata as Record<string, unknown> | undefined)?.detail ?? "unknown",
    country: d.country ?? null,
    currency: d.currency ?? null,
    createdAt: d.created_at,
  }));
}

function topProblems(failureLog: Awaited<ReturnType<typeof computeFailureLog>>) {
  const counts = new Map<string, { tool: string; event: string; reason: string; count: number }>();
  for (const f of failureLog) {
    const key = `${f.tool}|${f.event}|${f.reason}`;
    const existing = counts.get(key);
    if (existing) existing.count++;
    else counts.set(key, { tool: f.tool, event: f.event, reason: String(f.reason), count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 10);
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30d";
  const country = searchParams.get("country") || null;
  const currency = searchParams.get("currency") || null;

  const cacheKey = `${range}|${country}|${currency}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    await connectDB();
    const since = rangeSince(range);

    const [cvChecker, cvBuilder, personalityTest, failureLog, countries, currencies] = await Promise.all([
      computeToolFunnel("cv_checker", since, country, currency),
      computeToolFunnel("cv_builder", since, country, currency),
      computeToolFunnel("personality_test", since, country, currency),
      computeFailureLog(since, country, currency),
      ToolEvent.distinct("country", { country: { $ne: null } }),
      ToolEvent.distinct("currency", { currency: { $ne: null } }),
    ]);

    const data = {
      generatedAt: new Date().toISOString(),
      liveTrackingSince: LIVE_TRACKING_SINCE,
      range,
      tools: { cv_checker: cvChecker, cv_builder: cvBuilder, personality_test: personalityTest },
      failureLog,
      topProblems: topProblems(failureLog),
      revenueComparison: [cvChecker, cvBuilder, personalityTest].map((t) => ({ tool: t.tool, revenue: t.revenue.total, avgPerVisitor: t.revenue.avgPerVisitor })),
      filterOptions: { countries: (countries as string[]).sort(), currencies: (currencies as string[]).sort() },
    };

    cache.set(cacheKey, { at: Date.now(), data });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
