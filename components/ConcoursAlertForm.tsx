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
      <div className="h-full bg-concours-green/10 border border-concours-green/30 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
        <p className="text-sm font-semibold text-concours-green">✅ Alerte activée !</p>
        <p className="text-xs text-concours-green/80 mt-1">Vous recevrez les nouveaux concours par email.</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-concours-bg border border-concours-border rounded-2xl p-6 flex flex-col">
      <p className="text-base font-bold text-concours-navy mb-2">🔔 Recevez les nouveaux concours par email</p>
      <p className="text-xs text-gray-500 mb-4 flex-1">Soyez alerté dès qu&apos;un nouveau concours correspondant à votre profil est publié.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.com"
          className="w-full px-3 py-2.5 rounded-lg border border-concours-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-concours-turquoise/30 focus:border-concours-turquoise"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-concours-navy text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-60 whitespace-nowrap"
        >
          {status === "loading" ? "…" : "S'inscrire aux alertes"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-xs text-red-500 mt-2">Une erreur est survenue. Réessayez.</p>
      )}
    </div>
  );
}
