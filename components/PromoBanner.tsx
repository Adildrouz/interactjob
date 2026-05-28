"use client";
import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";

// Promo end: June 3, 2026 at 23:59 Casablanca (UTC+1) = 22:59 UTC
const PROMO_END = new Date("2026-06-03T22:59:59Z");
const STORAGE_KEY = "promo-cv-dismissed-v1";

export default function PromoBanner() {
  const [visible, setVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Don't show if already on the services-cv page
    if (window.location.pathname.includes("services-cv")) return;

    // Check expiry
    if (Date.now() >= PROMO_END.getTime()) { setExpired(true); return; }

    // Show after 4 seconds
    const showTimer = setTimeout(() => setVisible(true), 4000);

    const update = () => {
      const diff = PROMO_END.getTime() - Date.now();
      if (diff <= 0) { setExpired(true); setVisible(false); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const ticker = setInterval(update, 1000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(ticker);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  if (!visible || expired) return null;

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-sm z-40 animate-in slide-in-from-bottom-4 duration-500"
      style={{ animation: "slideUp 0.4s ease-out" }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl shadow-2xl shadow-red-900/30 overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300" />

        <div className="px-4 py-3 flex items-center gap-3">
          {/* Icon */}
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            🔥
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-xs uppercase tracking-wider">
              Offre Flash — CV Pro
            </p>
            <p className="text-white text-sm font-bold">
              <span className="line-through text-white/50 text-xs mr-1">199 MAD</span>
              <span className="text-yellow-300 text-base">99 MAD</span>
              <span className="ml-1.5 bg-white/20 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">-50%</span>
            </p>
            {/* Countdown */}
            <p className="text-white/70 text-[11px] font-mono tabular-nums mt-0.5">
              ⏱️&nbsp;
              {String(timeLeft.d).padStart(2, "0")}j&nbsp;:&nbsp;
              {String(timeLeft.h).padStart(2, "0")}h&nbsp;:&nbsp;
              {String(timeLeft.m).padStart(2, "0")}m&nbsp;:&nbsp;
              {String(timeLeft.s).padStart(2, "0")}s
            </p>
          </div>

          {/* CTA */}
          <Link
            href={"/services-cv" as any}
            className="flex-shrink-0 bg-white text-red-600 text-xs font-black px-3 py-2 rounded-xl hover:bg-yellow-50 hover:scale-105 transition-all duration-150 whitespace-nowrap shadow-lg"
            onClick={dismiss}
          >
            J'en profite →
          </Link>

          {/* Close */}
          <button
            onClick={dismiss}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-1"
            aria-label="Fermer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
