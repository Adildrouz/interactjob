"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "ij_session_id";

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    const viewKey = `ij_pv_${pathname}`;
    try {
      // One ping per URL per session (deduplicated client-side)
      if (sessionStorage.getItem(viewKey)) return;
      sessionStorage.setItem(viewKey, "1");
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pathname, sessionId }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [pathname]);

  return null;
}
