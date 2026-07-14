"use client";
import { useState, useEffect, useRef } from "react";
import { trackToolEvent } from "@/lib/trackToolEvent";

interface Props {
  /** Pre-filled criteria from active filters (offres page) */
  city?: string;
  sector?: string;
  keyword?: string;
  /** compact = inline bar (listing page) · card = boxed (sidebar / homepage) */
  variant?: "compact" | "card";
  sourcePage?: string;
}

export default function JobAlertSignup({ city = "", sector = "", keyword = "", variant = "card", sourcePage = "offres" }: Props) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const emailEnteredRef = useRef(false);

  useEffect(() => {
    trackToolEvent("email_alerts", "alert_form_viewed", { metadata: { alert_type: "offres", source_page: sourcePage } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onEmailChange(value: string) {
    setEmail(value);
    if (!emailEnteredRef.current && value.length > 0) {
      emailEnteredRef.current = true;
      trackToolEvent("email_alerts", "alert_email_entered", { metadata: { alert_type: "offres" } });
    }
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city, sector, keyword, sourcePage }),
      });
      if (!res.ok) throw new Error();
      setState("done");
      trackToolEvent("email_alerts", "alert_submitted", { metadata: { alert_type: "offres", source_page: sourcePage } });
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className={`${variant === "card" ? "bg-green-50 border border-green-200 rounded-2xl p-5" : "bg-green-50 border border-green-200 rounded-xl px-4 py-3"} text-center`}>
        <p className="text-sm font-bold text-green-800">✅ Vérifiez votre boîte mail !</p>
        <p className="text-xs text-green-700 mt-1">Cliquez sur le lien de confirmation pour activer votre alerte.</p>
      </div>
    );
  }

  const criteria = [keyword, sector, city].filter(Boolean).join(" · ");

  if (variant === "compact") {
    return (
      <form onSubmit={subscribe} className="bg-gradient-to-r from-primary to-[#1a47c8] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 min-w-0 text-white">
          <p className="font-bold text-sm flex items-center gap-2">🔔 Recevez ces offres par email</p>
          <p className="text-xs text-blue-200 mt-0.5 truncate">
            {criteria ? `Critères : ${criteria}` : "Soyez le premier informé des nouvelles offres"}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <input
            type="email"
            required
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl outline-none w-full sm:w-56 text-gray-800"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="bg-accent text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-60 whitespace-nowrap"
          >
            {state === "sending" ? "..." : "Activer"}
          </button>
        </div>
        {state === "error" && <p className="text-xs text-red-200 w-full sm:w-auto">Erreur — réessayez.</p>}
      </form>
    );
  }

  return (
    <form onSubmit={subscribe} className="bg-white rounded-2xl border-2 border-primary/15 shadow-sm p-5">
      <p className="font-bold text-gray-900 text-sm flex items-center gap-2">🔔 Alerte emploi gratuite</p>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
        {criteria
          ? `Recevez les nouvelles offres « ${criteria} » directement par email.`
          : "Recevez les nouvelles offres directement par email. Désinscription en 1 clic."}
      </p>
      <input
        type="email"
        required
        placeholder="votre@email.com"
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        className="mt-3 w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-2.5 w-full bg-primary text-white text-sm font-bold py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {state === "sending" ? "Activation…" : "Activer mon alerte"}
      </button>
      {state === "error" && <p className="text-xs text-red-600 mt-2">Erreur — réessayez.</p>}
    </form>
  );
}
