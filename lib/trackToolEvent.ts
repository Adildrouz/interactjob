"use client";

/**
 * Fire-and-forget funnel event tracking for the monetized/lead-gen tools
 * (CV Checker, CV Builder, Personality Tests, Email Alerts). Never throws,
 * never awaited by callers, never blocks the UX — this is a strict
 * requirement, not an optimization.
 *
 * No PII: only an anonymous, client-generated session id is sent. Never pass
 * names, emails, or CV/assessment content in `metadata`.
 */

export type ToolName = "cv_checker" | "cv_builder" | "personality_test" | "email_alerts";
export type TestType = "mbti" | "disc" | "couleurs" | "enneagramme" | "professionnel";

const SESSION_KEY = "ij_tool_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = window.localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Storage unavailable (private mode, quota, etc.) — fall back to a
    // per-call random id rather than failing tracking outright.
    return `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function trackToolEvent(
  tool: ToolName,
  event: string,
  opts: { testType?: TestType; metadata?: Record<string, unknown> } = {}
): void {
  if (typeof window === "undefined") return;

  try {
    const payload = JSON.stringify({
      session_id: getSessionId(),
      tool,
      test_type: opts.testType ?? null,
      event,
      metadata: opts.metadata ?? {},
    });

    // sendBeacon survives page unload/navigation — critical for abandonment
    // and payment-redirect events. Falls back to a keepalive fetch.
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/track-event", blob);
      if (sent) return;
    }

    fetch("/api/track-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let a tracking bug affect the tool's UX.
  }
}
