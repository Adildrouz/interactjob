"use client";

import { useEffect, useRef } from "react";
import { trackToolEvent, type ToolName, type TestType } from "@/lib/trackToolEvent";

/**
 * Fires a single "*_abandoned" event when the user navigates away/closes the
 * tab/reloads, unless `getMetadata` returns null (e.g. the flow already
 * completed, so there's nothing to call an abandonment).
 *
 * Uses `pagehide` only (not `visibilitychange`) so switching tabs or
 * backgrounding the app doesn't get miscounted as abandonment.
 */
export function useFunnelAbandonment(
  tool: ToolName,
  event: string,
  getMetadata: () => Record<string, unknown> | null,
  opts: { testType?: TestType } = {}
) {
  const metaRef = useRef(getMetadata);
  const testType = opts.testType;

  // Keep the ref pointing at the latest closure, but only as a render side
  // effect (never mutate a ref during render itself).
  useEffect(() => {
    metaRef.current = getMetadata;
  });

  useEffect(() => {
    function fire() {
      const metadata = metaRef.current();
      if (metadata === null) return;
      trackToolEvent(tool, event, { testType, metadata });
    }
    window.addEventListener("pagehide", fire);
    return () => window.removeEventListener("pagehide", fire);
  }, [tool, event, testType]);
}
