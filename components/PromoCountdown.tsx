"use client";
import { useState, useEffect } from "react";

// Promo end: June 3, 2026 at 23:59 Casablanca (UTC+1) = 22:59 UTC
const PROMO_END = new Date("2026-06-03T22:59:59Z");

function Digit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-black font-mono tabular-nums">
        {value}
      </div>
      <span className="text-white/60 text-[10px] mt-1.5 uppercase tracking-widest font-semibold">
        {label}
      </span>
    </div>
  );
}

export default function PromoCountdown() {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [expired, setExpired] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () => {
      const diff = PROMO_END.getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  if (!mounted || expired) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-orange-500 text-white py-12 px-4">
      {/* Animated background pulse */}
      <div className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 animate-pulse">
          🔥 Offre Flash — Durée Limitée
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-2 leading-tight">
          CV Pro à{" "}
          <span className="text-yellow-300 drop-shadow-sm">-50%</span>
          {" "}— Seulement{" "}
          <span className="text-yellow-300">99 MAD</span>
        </h2>
        <p className="text-white/75 text-sm sm:text-base mb-8">
          Au lieu de{" "}
          <span className="line-through opacity-60">199 MAD</span>
          {" "}· Offre valable jusqu'au <strong className="text-white">3 juin 2026</strong> uniquement
        </p>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 mb-8">
          <Digit value={String(timeLeft.d).padStart(2, "0")} label="Jours" />
          <span className="text-3xl font-black text-white/40 pb-5">:</span>
          <Digit value={String(timeLeft.h).padStart(2, "0")} label="Heures" />
          <span className="text-3xl font-black text-white/40 pb-5">:</span>
          <Digit value={String(timeLeft.m).padStart(2, "0")} label="Min" />
          <span className="text-3xl font-black text-white/40 pb-5">:</span>
          <Digit value={String(timeLeft.s).padStart(2, "0")} label="Sec" />
        </div>

        {/* Scarcity bar */}
        <div className="max-w-xs mx-auto mb-8">
          <div className="flex justify-between text-xs text-white/60 mb-1.5">
            <span>⚡ Places limitées</span>
            <span className="font-bold text-yellow-300">72% réservées</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full transition-all duration-1000" style={{ width: "72%" }} />
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#commander"
            className="w-full sm:w-auto bg-white text-red-600 font-black px-8 py-4 rounded-2xl text-base shadow-2xl shadow-red-900/40 hover:bg-yellow-50 hover:scale-[1.03] active:scale-100 transition-all duration-200"
          >
            🎯 Commander à 99 MAD maintenant
          </a>
          <a
            href="https://wa.me/212630960352?text=Bonjour%20Adil%2C%20je%20veux%20profiter%20de%20l%27offre%20flash%2050%25%20pour%20le%20CV%20Pro%20à%2099%20MAD%20!"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-[#25D366] hover:bg-[#1fb956] text-white font-bold px-6 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-[1.03] active:scale-100"
          >
            📲 Poser une question sur WhatsApp
          </a>
        </div>

        {/* Trust micro-copy */}
        <p className="text-white/50 text-xs mt-5">
          🔒 Paiement sécurisé · Livraison 48h · 1 révision incluse
        </p>
      </div>
    </section>
  );
}
