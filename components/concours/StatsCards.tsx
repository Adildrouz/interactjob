"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ClipboardList, Users, AlarmClock, Landmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import CountUp from "./CountUp";

interface StatsCardsProps {
  activeCount: number;
  totalPostes: number;
  expiringSoonCount: number;
  organismeCount: number;
}

const CARDS: { key: keyof StatsCardsProps; label: string; from: string; to: string; Icon: LucideIcon }[] = [
  { key: "activeCount", label: "Concours actifs", from: "#00347A", to: "#001F4D", Icon: ClipboardList },
  { key: "totalPostes", label: "Postes ouverts", from: "#00C2CB", to: "#0891B2", Icon: Users },
  { key: "expiringSoonCount", label: "Clôturent bientôt", from: "#2E6FA8", to: "#1E3A5F", Icon: AlarmClock },
  { key: "organismeCount", label: "Organismes qui recrutent", from: "#2E7D52", to: "#1C5335", Icon: Landmark },
];

export default function StatsCards(props: StatsCardsProps) {
  const reduce = useReducedMotion();

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
      {CARDS.map((card, i) => (
        <motion.div
          key={card.key}
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${card.from} 0%, ${card.to} 100%)` }}
        >
          <card.Icon className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10" strokeWidth={1.5} aria-hidden="true" />
          <card.Icon className="w-5 h-5 text-white/70 mb-2" strokeWidth={2} aria-hidden="true" />
          <p className="text-2xl sm:text-3xl font-extrabold leading-none tabular-nums">
            <CountUp value={props[card.key]} />
          </p>
          <p className="text-xs sm:text-sm text-white/85 mt-2 font-medium">{card.label}</p>
        </motion.div>
      ))}
    </section>
  );
}
