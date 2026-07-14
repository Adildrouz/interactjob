import { connectDB } from "@/lib/db";
import { ToolEvent, type ToolName } from "@/lib/models/ToolEvent";

/**
 * Server-side counterpart to lib/trackToolEvent.ts (which only works in the
 * browser via sendBeacon). Used where the event originates from a server
 * request with no browser context — email open pixels, click-through
 * redirects, and confirmation links.
 *
 * subscriberId ties every event for one alert subscriber together (view →
 * submit → confirm → open → click → unsubscribe) without ever storing the
 * email address itself in tool_events — matches the "no PII" rule the
 * collection was built under.
 */
export async function trackServerEvent(
  tool: ToolName,
  event: string,
  opts: { subscriberId?: string; metadata?: Record<string, unknown> } = {}
): Promise<void> {
  try {
    await connectDB();
    await ToolEvent.create({
      session_id: opts.subscriberId ? `sub_${opts.subscriberId}` : `srv_${Date.now().toString(36)}`,
      tool,
      event,
      metadata: opts.metadata ?? {},
    });
  } catch (err) {
    // Fire-and-forget — tracking must never break the actual request (pixel
    // response, redirect, confirmation page).
    console.error(`trackServerEvent(${tool}, ${event}) failed:`, err);
  }
}
