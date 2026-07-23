"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Briefcase, Building2, GraduationCap, Landmark,
  MapPin, ScrollText, Sparkles, Stethoscope, Zap,
} from "lucide-react";
import HeroSearch from "@/components/HeroSearch";
import { CHIP_SHAPE, DISPLAY, HAND, HERO_GLOW, STAR_TILE, SPRING, reveal, stagger } from "@/lib/design";

/** Job-category tiles drifting in the whitespace around the search bar. */
const FLOAT_TILES = [
  { icon: Briefcase,      cls: "-left-24 -top-16",    color: "text-navy-600", delay: 0 },
  { icon: Zap,            cls: "-right-20 -top-20",   color: "text-tq-600",   delay: 0.8 },
  { icon: Stethoscope,    cls: "-left-44 top-3",      color: "text-tq-700",   delay: 1.6 },
  { icon: Building2,      cls: "-right-44 top-5",     color: "text-navy-500", delay: 2.4 },
  { icon: GraduationCap,  cls: "-left-28 -bottom-16", color: "text-navy-400", delay: 1.2 },
  { icon: Landmark,       cls: "-right-24 -bottom-14",color: "text-tq-600",   delay: 2.0 },
];

export default function HomeHero({ jobCount }: { jobCount: string }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const isAr = locale === "ar";
  const reduce = useReducedMotion();

  const chips = [
    { icon: Briefcase, label: t("chipJobs"),     href: "/offres",              tint: "bg-navy-50 text-navy-700 border-navy-100 hover:border-navy-300" },
    { icon: Zap,       label: t("chipRemote"),   href: "/offres/remote",       tint: "bg-tq-50 text-tq-800 border-tq-200 hover:border-tq-400" },
    { icon: Landmark,  label: t("chipConcours"), href: "/concours",            tint: "bg-navy-50 text-navy-700 border-navy-100 hover:border-navy-300" },
    { icon: Sparkles,  label: t("chipTools"),    href: "/cv-checker",          tint: "bg-tq-50 text-tq-800 border-tq-200 hover:border-tq-400" },
  ];

  return (
    <header className="relative overflow-hidden bg-white">
      {/* soft brand glows — light canvas, never a dark hero */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: HERO_GLOW }} />
      {/* faint five-point-star filigrane, fading downward */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: STAR_TILE, maskImage: "linear-gradient(to bottom, black, transparent 65%)" }}
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-20 text-center">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          {/* No eyebrow badge — the headline carries itself. */}
          <motion.h1
            variants={reveal}
            className={`${DISPLAY} text-[2rem] sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] text-navy-900`}
          >
            {t("heroTitleLead")}{" "}
            <span className="relative inline-block text-tq-600">
              {t("heroTitleHighlight")}
              {/* hand-drawn brush underline — not a gradient, not a flat rule */}
              <svg
                viewBox="0 0 120 12" preserveAspectRatio="none" aria-hidden
                className="absolute -bottom-1.5 sm:-bottom-2 left-0 h-[8px] sm:h-[10px] w-full"
              >
                <path
                  d="M4 9 Q 28 3.5 58 7 Q 90 10 116 4.5"
                  fill="none" stroke="#00C2CB" strokeWidth="4" strokeLinecap="round" opacity="0.85"
                />
              </svg>
            </span>{" "}
            {t("heroTitleTail")}
          </motion.h1>

          <motion.p
            variants={reveal}
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-navy-700/80 leading-relaxed"
          >
            {t("heroSubtitle")}
          </motion.p>

          {/* ── the search stage: primary interactive focus ── */}
          <motion.div variants={reveal} className="relative mx-auto mt-12 sm:mt-14 max-w-2xl">
            {/* handwritten credibility note — replaces the generic pill badge */}
            <div
              aria-hidden
              className={`absolute -top-11 hidden md:block ${isAr ? "left-0 rotate-[5deg]" : "right-0 rotate-[-5deg]"} ${HAND} text-[21px] font-semibold text-tq-700 whitespace-nowrap`}
            >
              {t("heroNote", { count: jobCount })}
              <svg
                viewBox="0 0 60 40" fill="none" aria-hidden
                className={`absolute top-3 h-9 w-12 text-tq-600 ${isAr ? "-right-12 -scale-x-100" : "-left-12"}`}
              >
                <path d="M52 6 Q 22 10 14 30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M9 22 L14 31 L21 26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* breathing brand-colour shape behind the bar */}
            <motion.div
              aria-hidden
              className="absolute -inset-x-16 -inset-y-12 rounded-[48px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(55% 70% at 50% 50%, rgba(0,194,203,0.14), rgba(0,52,122,0.05) 60%, transparent 80%)",
              }}
              animate={reduce ? undefined : { scale: [1, 1.05, 1], opacity: [0.9, 1, 0.9] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* floating job-category tiles */}
            {FLOAT_TILES.map(({ icon: Icon, cls, color, delay }) => (
              <motion.span
                key={cls}
                aria-hidden
                className={`absolute ${cls} hidden lg:flex h-11 w-11 items-center justify-center rounded-xl border border-navy-100 bg-white/90 shadow-[0_10px_24px_-12px_rgba(0,52,122,0.35)] backdrop-blur-sm`}
                animate={reduce ? undefined : { y: [0, -9, 0], rotate: [0, 2.5, 0] }}
                transition={{ duration: 4.6, repeat: Infinity, delay, ease: "easeInOut" }}
              >
                <Icon size={19} className={color} />
              </motion.span>
            ))}

            <div className="relative">
              <HeroSearch />
            </div>
          </motion.div>

          {/* quick categories — concours is one option among equals */}
          <motion.div variants={reveal} className="mt-8 flex flex-wrap justify-center gap-2.5 sm:gap-3">
            {chips.map(({ icon: Icon, label, href, tint }) => (
              <motion.div key={label} whileHover={reduce ? undefined : { y: -2 }} transition={SPRING}>
                <Link
                  href={href as "/offres"}
                  className={`inline-flex items-center gap-2 ${CHIP_SHAPE} border px-3.5 sm:px-4 py-2 text-[13px] sm:text-sm font-bold transition-colors ${tint}`}
                >
                  <Icon size={15} /> {label}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* credibility line: understated plain text, no pills or borders */}
          <motion.p variants={reveal} className="mt-10 text-[13px] sm:text-sm text-navy-500">
            {t("heroProofJobs")}
            <span className="mx-2 sm:mx-3 text-tq-500" aria-hidden>·</span>
            {t("heroProofCities")}
            <span className="mx-2 sm:mx-3 text-tq-500" aria-hidden>·</span>
            {t("heroProofCode")}
          </motion.p>
        </motion.div>
      </div>
    </header>
  );
}
