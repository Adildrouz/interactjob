"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/trackEvent";

export default function ConcoursAlertForm({ sector }: { sector?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "done") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/concours-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, sector }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      trackEvent("concours_alert_signup", { sector: sector || "all" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-green-700">✅ Alerte activée !</p>
        <p className="text-xs text-green-600 mt-1">Vous recevrez les nouveaux concours par email.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
      <p className="text-sm font-bold text-gray-900 mb-1">🔔 Alertes concours</p>
      <p className="text-xs text-gray-500 mb-3">Recevez les nouveaux concours par email, dès leur publication.</p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {status === "loading" ? "…" : "S'inscrire"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-red-500 mt-2">Une erreur est survenue. Réessayez.</p>
      )}
    </div>
  );
}
