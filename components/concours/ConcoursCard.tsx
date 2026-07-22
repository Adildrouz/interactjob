"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { Building2, Briefcase, CalendarClock, MapPin, Bell, ArrowRight, Globe } from "lucide-react";
import { Concours } from "@/types";
import { formatDate, isExpiringSoon, inferOnlineSubmission, inferRegion } from "@/lib/concours";
import { institutionStyle } from "@/lib/concours-institution";
import { trackEvent } from "@/lib/trackEvent";
import OrganismeCrest from "./OrganismeCrest";

export const CARD_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
};

function daysRemaining(deadline: string) {
  const diff = (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(diff));
}

function scrollToAlerts(e: React.MouseEvent, slug: string) {
  e.preventDefault();
  e.stopPropagation();
  trackEvent("concours_bell_click", { slug });
  document.getElementById("concours-alerts")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export default function ConcoursCard({ concours: c }: { concours: Concours }) {
  const reduce = useReducedMotion();
  const style = institutionStyle(c.organization_fr);
  const expiring = isExpiringSoon(c.deadline, 7);
  const online = inferOnlineSubmission(c);
  const region = inferRegion(c);
  const days = c.deadline ? daysRemaining(c.deadline) : null;

  return (
    <motion.div
      variants={CARD_ITEM_VARIANTS}
      whileHover={reduce ? undefined : { y: -5 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className="group relative h-full"
    >
      {/* accent strip encodes institution type at a glance */}
      <span
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl z-10"
        style={{ background: `linear-gradient(90deg, ${style.accent}, ${style.accentDark})` }}
        aria-hidden="true"
      />
      <Link
        href={`/concours/${c.slug}` as any}
        onClick={() => trackEvent("concours_card_click", { slug: c.slug })}
        className={`flex flex-col h-full bg-white rounded-2xl border ${
          expiring ? "border-orange-200" : "border-concours-border"
        } shadow-sm group-hover:shadow-xl group-hover:border-concours-navy/40 transition-shadow duration-300 p-5 pt-6`}
      >
        <div className="flex items-start gap-3">
          <OrganismeCrest name={c.organization_fr} size="lg" />
          <div className="flex-1 min-w-0">
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5"
              style={{ color: style.accent, backgroundColor: style.soft }}
            >
              {style.label}
            </span>
            <h3 className="font-bold text-concours-navy text-sm leading-snug line-clamp-2">
              {c.title_fr}
            </h3>
          </div>
          <button
            onClick={(e) => scrollToAlerts(e, c.slug)}
            aria-label="Créer une alerte pour ce concours"
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-concours-turquoise hover:bg-concours-bg transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-gray-500 mt-2.5">
          <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
          <span className="line-clamp-1">{c.organization_fr}</span>
        </p>

        {/* key facts — scannable icon+label pairs */}
        <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {!!c.postes && (
            <span className="flex items-center gap-1.5 text-gray-600">
              <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-800">{c.postes}</span> poste{c.postes > 1 ? "s" : ""}
            </span>
          )}
          {region && region !== "National" && (
            <span className="flex items-center gap-1.5 text-gray-600 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="line-clamp-1">{region}</span>
            </span>
          )}
          {online && (
            <span className="flex items-center gap-1.5 text-concours-turquoise font-medium">
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              Dépôt en ligne
            </span>
          )}
          {c.deadline && (
            <span className={`flex items-center gap-1.5 ${expiring ? "text-orange-600 font-semibold" : "text-gray-600"}`}>
              <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
              {formatDate(c.deadline)}
            </span>
          )}
        </div>

        {/* footer: urgency + CTA */}
        <div className="mt-4 flex items-center justify-between gap-2">
          {expiring && days !== null ? (
            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">
              ⏳ Plus que {days} j
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-concours-navy group-hover:gap-2 transition-all">
            Voir l&apos;annonce
            <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
