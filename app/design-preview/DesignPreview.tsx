"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  animate,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  Bell,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Flame,
  GraduationCap,
  HeartPulse,
  Landmark,
  MapPin,
  Plus,
  RotateCcw,
  Scale,
  ScrollText,
  Search,
  Shield,
  Sparkles,
  Stethoscope,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Motion vocabulary — "vif & assuré" (snappy, confident)              */
/* ------------------------------------------------------------------ */
const SPRING = { type: "spring", stiffness: 380, damping: 28 } as const;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

/* Faint Moroccan five-point star, tiled as an institutional texture */
const STAR_TILE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Cpath d='M64 54l1.7 3.65 3.85.45-2.9 2.85.75 4.05-3.4-1.95-3.4 1.95.75-4.05-2.9-2.85 3.85-.45z' fill='%2300347A' fill-opacity='0.055'/%3E%3C/svg%3E\")";

function Section({
  id,
  eyebrow,
  title,
  children,
  tinted = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <section id={id} className={`py-20 px-6 ${tinted ? "bg-navy-50/50" : "bg-white"}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.p
            variants={reveal}
            className="text-[13px] font-bold uppercase tracking-[0.14em] text-tq-700 mb-2"
          >
            {eyebrow}
          </motion.p>
          <motion.h2
            variants={reveal}
            className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight mb-10 text-navy-900"
          >
            {title}
          </motion.h2>
          {children}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Count-up number                                                     */
/* ------------------------------------------------------------------ */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduce) {
      ref.current.textContent = to.toLocaleString("fr-FR") + suffix;
      return;
    }
    const controls = animate(0, to, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        if (ref.current)
          ref.current.textContent = Math.round(v).toLocaleString("fr-FR") + suffix;
      },
    });
    return () => controls.stop();
  }, [inView, to, suffix, reduce]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ------------------------------------------------------------------ */
/* 1 — Hero specimen: centered, jobs-first, animated search stage      */
/* ------------------------------------------------------------------ */
const FLOAT_TILES: {
  icon: typeof Briefcase;
  cls: string;
  color: string;
  delay: number;
}[] = [
  { icon: Briefcase, cls: "-left-24 -top-16", color: "text-navy-600", delay: 0 },
  { icon: Zap, cls: "-right-20 -top-20", color: "text-tq-600", delay: 0.8 },
  { icon: Stethoscope, cls: "-left-44 top-3", color: "text-tq-700", delay: 1.6 },
  { icon: Building2, cls: "-right-44 top-5", color: "text-navy-500", delay: 2.4 },
  { icon: GraduationCap, cls: "-left-28 -bottom-16", color: "text-navy-400", delay: 1.2 },
  { icon: Landmark, cls: "-right-24 -bottom-14", color: "text-tq-600", delay: 2.0 },
];

function HeroSpecimen() {
  const reduce = useReducedMotion();
  return (
    <header className="relative overflow-hidden bg-white">
      {/* soft brand glows on a light canvas */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(820px 400px at 30% -12%, rgba(0,194,203,0.10), transparent 60%), radial-gradient(700px 360px at 75% 0%, rgba(0,52,122,0.06), transparent 55%)",
        }}
      />
      {/* faint Moroccan star tiling, fading downward */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: STAR_TILE,
          maskImage: "linear-gradient(to bottom, black, transparent 65%)",
        }}
      />
      <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div
            variants={reveal}
            className="inline-flex items-center gap-2 rounded-full border border-tq-200 bg-tq-50 px-4 py-1.5 text-sm font-semibold text-tq-800 mb-7"
          >
            <span className="relative flex h-2 w-2">
              {!reduce && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tq-500 opacity-60" />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-tq-500" />
            </span>
            Plateforme d&apos;emploi marocaine — offres vérifiées chaque jour
          </motion.div>

          <motion.h1
            variants={reveal}
            className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-bold tracking-tight leading-[1.06] text-navy-900"
          >
            Trouvez votre prochain <span className="text-tq-600">emploi</span> au Maroc.
          </motion.h1>

          <motion.p
            variants={reveal}
            className="mx-auto mt-5 max-w-2xl text-lg text-navy-700/80 leading-relaxed"
          >
            CDI, CDD, stages et postes remote à Casablanca, Rabat, Tanger et dans 45
            autres villes — publiés par des entreprises réelles et vérifiés chaque jour.
          </motion.p>

          {/* ---- animated search stage: the focal point ---- */}
          <motion.div variants={reveal} className="relative mx-auto mt-12 max-w-2xl">
            {/* breathing gradient shape behind the bar */}
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
                className={`absolute ${cls} hidden md:flex h-11 w-11 items-center justify-center rounded-xl border border-navy-100 bg-white/90 shadow-[0_10px_24px_-12px_rgba(0,52,122,0.35)] backdrop-blur-sm`}
                animate={reduce ? undefined : { y: [0, -9, 0], rotate: [0, 2.5, 0] }}
                transition={{ duration: 4.6, repeat: Infinity, delay, ease: "easeInOut" }}
              >
                <Icon size={19} className={color} />
              </motion.span>
            ))}
            {/* the search bar — primary interactive element */}
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2 rounded-2xl border border-navy-100 bg-white p-2 shadow-[0_24px_60px_-20px_rgba(0,52,122,0.28)]">
              <div className="flex flex-1 items-center gap-2 min-w-0">
                <Search size={19} className="ml-3 shrink-0 text-navy-400" />
                <span className="flex-1 truncate text-left text-navy-400 text-[15px]">
                  Poste, mots-clés ou entreprise…
                </span>
              </div>
              <div className="hidden sm:block h-7 w-px bg-navy-100" aria-hidden />
              <span className="flex items-center gap-1.5 px-3 text-[15px] font-medium text-navy-600">
                <MapPin size={16} className="text-navy-400" /> Toutes les villes
                <ChevronRight size={14} className="rotate-90 text-navy-400" />
              </span>
              <motion.span
                whileHover={reduce ? undefined : { y: -1 }}
                transition={SPRING}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy-700 px-6 py-3 font-bold text-white text-[15px] shadow-[0_6px_18px_-6px_rgba(0,52,122,0.5)]"
              >
                Rechercher
              </motion.span>
            </div>
          </motion.div>

          {/* quick categories — concours is one option among others */}
          <motion.div variants={reveal} className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { icon: Briefcase, label: "Offres d'emploi", tint: "bg-navy-50 text-navy-700 border-navy-100 hover:border-navy-300" },
              { icon: Zap, label: "Remote", tint: "bg-tq-50 text-tq-800 border-tq-200 hover:border-tq-400" },
              { icon: Landmark, label: "Concours publics", tint: "bg-navy-50 text-navy-700 border-navy-100 hover:border-navy-300" },
              { icon: Sparkles, label: "Outils CV & IA", tint: "bg-tq-50 text-tq-800 border-tq-200 hover:border-tq-400" },
            ].map(({ icon: Icon, label, tint }) => (
              <motion.a
                key={label}
                href="#composants"
                whileHover={reduce ? undefined : { y: -2 }}
                transition={SPRING}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${tint}`}
              >
                <Icon size={15} /> {label}
              </motion.a>
            ))}
          </motion.div>

          {/* concrete proof chips */}
          <motion.div variants={reveal} className="mt-12 flex flex-wrap justify-center gap-3">
            {[
              { icon: Briefcase, label: "Offres vérifiées, entreprises réelles" },
              { icon: MapPin, label: "48 villes couvertes" },
              { icon: ScrollText, label: "Code du Travail expliqué" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-navy-100 bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-sm"
              >
                <Icon size={15} className="text-tq-600" /> {label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* 2 — Color roles                                                     */
/* ------------------------------------------------------------------ */
function Swatch({ hex, name, big = false }: { hex: string; name: string; big?: boolean }) {
  const light = ["50", "100", "200", "light"].some((s) => name.endsWith(s));
  return (
    <div
      className={`rounded-xl flex flex-col justify-end p-3 ${big ? "h-28" : "h-20"}`}
      style={{ background: hex }}
    >
      <span className={`text-[11px] font-bold ${light ? "text-navy-800" : "text-white"}`}>{name}</span>
      <span className={`text-[11px] font-mono ${light ? "text-navy-600" : "text-white/70"}`}>{hex}</span>
    </div>
  );
}

const NAVY = [
  ["navy-50", "#EFF5FC"], ["navy-100", "#DCE8F9"], ["navy-200", "#BCD2F2"], ["navy-300", "#85ACE6"],
  ["navy-400", "#4A83D6"], ["navy-500", "#1E5FBF"], ["navy-600", "#0B4699"], ["navy-700", "#00347A"],
  ["navy-800", "#032757"], ["navy-900", "#041B3D"], ["navy-950", "#021026"],
];
const TQ = [
  ["tq-50", "#EAFCFD"], ["tq-100", "#CFF7F9"], ["tq-200", "#A3EEF2"], ["tq-300", "#67E2E8"],
  ["tq-400", "#2AD5DD"], ["tq-500", "#00C2CB"], ["tq-600", "#00A8B1"], ["tq-700", "#008E96"],
  ["tq-800", "#067077"], ["tq-900", "#045A60"],
];

function ColorSection() {
  return (
    <Section id="couleurs" eyebrow="Système de couleurs" title="Les couleurs de la marque, avec des rôles clairs">
      <motion.div variants={reveal} className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="rounded-2xl border-2 border-navy-700 bg-white p-6">
          <div className="mb-3 h-10 w-10 rounded-xl bg-navy-700" />
          <p className="font-[family-name:var(--font-display)] text-lg font-bold text-navy-900">Navy — l&apos;action</p>
          <p className="text-sm text-navy-600 mt-1 leading-relaxed">
            <span className="font-mono">#00347A</span> · boutons primaires, liens, titres.
            La couleur qu&apos;on clique.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-tq-500 bg-white p-6">
          <div className="mb-3 h-10 w-10 rounded-xl bg-tq-500" />
          <p className="font-[family-name:var(--font-display)] text-lg font-bold text-navy-900">Turquoise — le repère</p>
          <p className="text-sm text-navy-600 mt-1 leading-relaxed">
            <span className="font-mono">#00C2CB</span> · highlights, badges, CTA secondaires,
            mot-clé souligné. La couleur qui guide l&apos;œil.
          </p>
        </div>
        <div className="rounded-2xl border-2 border-coral-500 bg-white p-6">
          <div className="mb-3 h-10 w-10 rounded-xl bg-coral-500" />
          <p className="font-[family-name:var(--font-display)] text-lg font-bold text-navy-900">Corail — l&apos;urgence, seulement</p>
          <p className="text-sm text-navy-600 mt-1 leading-relaxed">
            <span className="font-mono">#FF6B45</span> · deadlines de concours (J-5), places
            limitées. Jamais en navigation générale.
          </p>
        </div>
      </motion.div>

      <motion.div variants={reveal} className="grid grid-cols-6 md:grid-cols-11 gap-2 mb-2">
        {NAVY.map(([n, h]) => <Swatch key={n} name={n} hex={h} />)}
      </motion.div>
      <motion.div variants={reveal} className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-10">
        {TQ.map(([n, h]) => <Swatch key={n} name={n} hex={h} />)}
      </motion.div>

      <motion.div variants={reveal} className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2"><Check size={16} className="text-success" /> Sémantique</h3>
          <div className="grid grid-cols-3 gap-2">
            <Swatch name="success" hex="#0CAE7D" />
            <Swatch name="warning" hex="#F5A623" />
            <Swatch name="error" hex="#D92D20" />
          </div>
          <p className="text-sm text-navy-600/80 mt-3 leading-relaxed">
            Un vert lagon, un ambre, un rouge distinct du corail d&apos;urgence.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2"><Sparkles size={16} className="text-tq-600" /> Dégradés — usage strictement limité</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-20 rounded-xl p-3 flex flex-col justify-end" style={{ background: "var(--gradient-atlas)" }}>
              <span className="text-[11px] font-bold text-white">Atlas</span>
              <span className="text-[11px] text-white/75">bandeau recruteur uniquement</span>
            </div>
            <div className="h-20 rounded-xl p-3 flex flex-col justify-end" style={{ background: "var(--gradient-encre)" }}>
              <span className="text-[11px] font-bold text-white">Encre</span>
              <span className="text-[11px] text-white/75">pied de page uniquement</span>
            </div>
          </div>
          <p className="text-sm text-navy-600/80 mt-3 leading-relaxed">
            Jamais sur du texte. Jamais sur un bouton. Deux bandes de section maximum par page.
          </p>
        </div>
      </motion.div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 3 — Moroccan institutional cues                                     */
/* ------------------------------------------------------------------ */
function CrestDemo({
  icon: Icon,
  label,
}: {
  icon: typeof Landmark;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-navy-700 text-white shadow-sm">
        <Icon size={26} />
        <svg width={11} height={11} viewBox="0 0 24 24" fill="#00C2CB" className="absolute top-1 right-1" aria-hidden>
          <path d="M12 2l2.9 6.26L21.5 9l-5 4.9 1.3 6.9L12 17.4 6.2 20.8l1.3-6.9-5-4.9 6.6-.74z" />
        </svg>
      </div>
      <span className="text-xs font-semibold text-navy-700">{label}</span>
    </div>
  );
}

function ReperesSection() {
  return (
    <Section id="reperes" eyebrow="Identité marocaine" title="Des repères institutionnels, pas des icônes génériques" tinted>
      <div className="grid md:grid-cols-2 gap-10 items-start">
        <motion.div variants={reveal}>
          <p className="text-navy-700 leading-relaxed mb-6">
            Le blason d&apos;institution (déjà éprouvé sur les concours) devient un motif
            central de la marque : chaque administration est identifiée par son type —
            ministère, santé, sécurité, justice, enseignement — frappé de l&apos;étoile à
            cinq branches. Uniforme, couvrant 100&nbsp;% des cas, aucune image cassée.
          </p>
          <div className="flex flex-wrap gap-6 rounded-2xl border border-navy-100 bg-white p-6">
            <CrestDemo icon={Landmark} label="Ministère" />
            <CrestDemo icon={GraduationCap} label="Enseignement" />
            <CrestDemo icon={Stethoscope} label="Santé" />
            <CrestDemo icon={Shield} label="Sécurité" />
            <CrestDemo icon={Scale} label="Justice" />
            <CrestDemo icon={Building2} label="Collectivités" />
          </div>
        </motion.div>
        <motion.div variants={reveal}>
          <p className="text-navy-700 leading-relaxed mb-6">
            La même étoile, en filigrane discret, texture les fonds clairs — un motif
            propriétaire au lieu des grilles de points génériques. Les catégories parlent
            le vocabulaire réel du marché marocain :
          </p>
          <div className="rounded-2xl border border-navy-100 bg-white p-6" style={{ backgroundImage: STAR_TILE }}>
            <div className="flex flex-wrap gap-2">
              {[
                "Fonction publique", "Informatique & IT", "Santé & Médical", "BTP & Ingénierie",
                "Enseignement", "Hôtellerie & Tourisme", "Finance & Comptabilité", "Offshoring",
              ].map((c, i) => (
                <span
                  key={c}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${
                    i % 2 ? "bg-navy-50 text-navy-700" : "bg-tq-50 text-tq-800"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-navy-500">
              Casablanca · Rabat · Marrakech · Tanger · Agadir · Fès · Oujda… 48 villes
            </p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 4 — Typography                                                      */
/* ------------------------------------------------------------------ */
function TypeSection() {
  return (
    <Section id="typo" eyebrow="Typographie" title="Bricolage Grotesque × Plus Jakarta Sans">
      <div className="grid md:grid-cols-2 gap-10">
        <motion.div variants={reveal}>
          <p className="text-sm font-bold text-tq-700 uppercase tracking-wider mb-3">Titres — Bricolage Grotesque</p>
          <p className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-tight text-navy-900 leading-[1.08]">
            Concours de la Fonction Publique&nbsp;: <span className="text-tq-600">1&nbsp;240 postes</span> ouverts
          </p>
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-navy-700 mt-6">
            Une grotesque à caractère — géométrique mais chaleureuse. Le seul ornement
            autorisé sur un titre&nbsp;: un mot-clé en turquoise plein.
          </p>
          <div className="mt-6 flex gap-2 flex-wrap">
            {["400", "500", "600", "700", "800"].map((w) => (
              <span key={w} className="font-[family-name:var(--font-display)] text-xl text-navy-800 rounded-lg bg-navy-50 px-3 py-1" style={{ fontWeight: Number(w) }}>
                Aa {w}
              </span>
            ))}
          </div>
        </motion.div>
        <motion.div variants={reveal}>
          <p className="text-sm font-bold text-tq-700 uppercase tracking-wider mb-3">Corps — Plus Jakarta Sans (déjà en place)</p>
          <p className="text-navy-800 leading-relaxed">
            Le corps reste en Plus Jakarta Sans : moderne, lisible, déjà chargé sur tout le
            site — zéro coût de performance ajouté. La hiérarchie naît du contraste entre
            la grotesque expressive des titres et la neutralité élégante du corps.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-navy-700">
            <li className="flex gap-2"><Check size={16} className="text-success mt-0.5 shrink-0" /> Échelle : 13 / 15 / 17 / 20 / 24 / 34 / 48 / 60px — ratio ~1.25</li>
            <li className="flex gap-2"><Check size={16} className="text-success mt-0.5 shrink-0" /> Titres : tracking -0.02em, graisse 700-800, navy-900</li>
            <li className="flex gap-2"><Check size={16} className="text-success mt-0.5 shrink-0" /> Eyebrows : 13px, 700, +0.14em, turquoise-700</li>
          </ul>
          <div dir="rtl" className="mt-6 rounded-2xl bg-navy-50 p-5">
            <p className="text-sm font-bold text-tq-700 mb-1">العربية — RTL</p>
            <p className="font-bold text-2xl text-navy-900">مباريات التوظيف والوظائف في المغرب</p>
            <p className="text-navy-700 text-sm mt-1">
              تعتمد النسخة العربية على سلسلة خطوط نظامية عالية الجودة، مع الحفاظ الكامل على الاتجاه من اليمين إلى اليسار.
            </p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 5 — Components                                                      */
/* ------------------------------------------------------------------ */
function Buttons() {
  const reduce = useReducedMotion();
  const base = "inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-[15px]";
  const hover = reduce ? undefined : { y: -2 };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <motion.button whileHover={hover} whileTap={{ scale: 0.97 }} transition={SPRING}
          className={`${base} bg-navy-700 text-white hover:bg-navy-800 transition-colors shadow-[0_8px_20px_-8px_rgba(0,52,122,0.5)]`}>
          Postuler <ArrowRight size={17} />
        </motion.button>
        <motion.button whileHover={hover} whileTap={{ scale: 0.97 }} transition={SPRING}
          className={`${base} bg-tq-500 text-navy-950 hover:bg-tq-400 transition-colors`}>
          Explorer les concours
        </motion.button>
        <motion.button whileHover={hover} whileTap={{ scale: 0.97 }} transition={SPRING}
          className={`${base} bg-tq-50 text-tq-800 border border-tq-200 hover:bg-tq-100 transition-colors`}>
          <Bell size={17} /> Créer une alerte
        </motion.button>
        <motion.button whileHover={hover} whileTap={{ scale: 0.97 }} transition={SPRING}
          className={`${base} border-2 border-navy-200 text-navy-700 hover:border-navy-400 transition-colors`}>
          Voir plus
        </motion.button>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-coral-400/60 bg-coral-50/50 p-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-coral-600">
          <Flame size={14} /> Contexte urgence — concours uniquement
        </span>
        <motion.button whileHover={hover} whileTap={{ scale: 0.97 }} transition={SPRING}
          className={`${base} bg-coral-500 text-white hover:bg-coral-600 transition-colors`}>
          <CalendarClock size={17} /> Clôture dans 5 jours
        </motion.button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-50 border border-coral-100 px-3 py-1.5 text-xs font-bold text-coral-600">
          <CalendarClock size={13} /> J-5
        </span>
      </div>
    </div>
  );
}

function JobCardDemo() {
  const reduce = useReducedMotion();
  const [saved, setSaved] = useState(false);
  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -5 }}
      transition={SPRING}
      className="group relative rounded-2xl border border-navy-100 bg-white p-5 shadow-sm hover:shadow-[0_24px_50px_-24px_rgba(0,52,122,0.35)] hover:border-navy-200 transition-[box-shadow,border-color] duration-300"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex shrink-0 items-center justify-center rounded-xl bg-navy-700 font-[family-name:var(--font-display)] text-lg font-bold text-white"
          style={{ width: 52, height: 52 }}>
          AD
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-[family-name:var(--font-display)] font-bold text-navy-900 leading-snug">
            Développeur Full-Stack React / Node
          </h4>
          <p className="text-sm text-navy-600 mt-0.5 flex items-center gap-1.5">
            Atlas Digital <span className="text-navy-300">•</span> <MapPin size={13} /> Casablanca
          </p>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          aria-label="Sauvegarder"
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
            saved ? "border-tq-400 bg-tq-50 text-tq-700" : "border-navy-200 text-navy-400 hover:border-navy-400"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={saved ? "y" : "n"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
              {saved ? <Check size={16} /> : <Plus size={16} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-bold text-navy-700">CDI</span>
        <span className="rounded-full bg-tq-50 px-3 py-1 text-xs font-bold text-tq-800">Hybride</span>
        <span className="rounded-full border border-navy-100 px-3 py-1 text-xs font-bold text-navy-600">React</span>
        <span className="rounded-full border border-navy-100 px-3 py-1 text-xs font-bold text-navy-600">Node.js</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-4">
        <div>
          <p className="font-[family-name:var(--font-display)] font-bold text-navy-900">18 000 – 25 000 <span className="text-xs font-semibold text-navy-500">MAD/mois</span></p>
          <p className="text-xs text-navy-400">il y a 2 jours</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-navy-700 px-4 py-2.5 text-sm font-bold text-white group-hover:bg-navy-800 transition-colors">
          Postuler <ChevronRight size={15} />
        </span>
      </div>
    </motion.article>
  );
}

function ConcoursCardDemo() {
  const reduce = useReducedMotion();
  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -5 }}
      transition={SPRING}
      className="group relative rounded-2xl border border-navy-100 bg-white p-5 shadow-sm hover:shadow-[0_24px_50px_-24px_rgba(0,52,122,0.35)] hover:border-navy-200 transition-[box-shadow,border-color] duration-300"
    >
      <div className="flex items-start gap-3.5">
        <div className="relative flex shrink-0 items-center justify-center rounded-xl bg-navy-700 text-white" style={{ width: 52, height: 52 }}>
          <Landmark size={24} />
          <svg width={10} height={10} viewBox="0 0 24 24" fill="#00C2CB" className="absolute top-1 right-1" aria-hidden>
            <path d="M12 2l2.9 6.26L21.5 9l-5 4.9 1.3 6.9L12 17.4 6.2 20.8l1.3-6.9-5-4.9 6.6-.74z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-1 inline-block rounded-full bg-tq-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-tq-800">Ministère</span>
          <h4 className="font-[family-name:var(--font-display)] font-bold text-navy-900 leading-snug">
            Concours de recrutement — 45 techniciens 3e grade
          </h4>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-navy-600">
        <span className="flex items-center gap-1.5"><Building2 size={14} /> Ministère de l&apos;Intérieur</span>
        <span className="flex items-center gap-1.5"><GraduationCap size={14} /> Bac+2</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-50 border border-coral-100 px-3 py-1.5 text-xs font-bold text-coral-600">
          <CalendarClock size={13} />
          <span className="tabular-nums">J-5</span> — clôture 27 juillet
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-navy-700 group-hover:text-tq-700 transition-colors">
          Détails <ArrowRight size={15} className={reduce ? "" : "transition-transform group-hover:translate-x-0.5"} />
        </span>
      </div>
    </motion.article>
  );
}

function StatsRow() {
  const stats = [
    { value: 1240, suffix: "+", label: "Offres actives" },
    { value: 320, suffix: "+", label: "Concours publics" },
    { value: 48, suffix: "", label: "Villes couvertes" },
    { value: 250, suffix: "K+", label: "Candidats touchés" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-navy-100 bg-white p-5 text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-navy-700 tabular-nums">
            <CountUp to={s.value} suffix={s.suffix} />
          </p>
          <p className="mt-1 text-sm font-semibold text-navy-600">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function ComponentsSection() {
  return (
    <Section id="composants" eyebrow="Composants" title="Le style appliqué aux patterns clés" tinted>
      <motion.div variants={reveal} className="mb-10">
        <h3 className="font-bold text-navy-900 mb-4">Boutons — hiérarchie d&apos;action</h3>
        <Buttons />
      </motion.div>
      <motion.div variants={reveal} className="mb-10 grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-navy-900 mb-4">Carte offre d&apos;emploi</h3>
          <JobCardDemo />
        </div>
        <div>
          <h3 className="font-bold text-navy-900 mb-4">Carte concours — corail sur la deadline seulement</h3>
          <ConcoursCardDemo />
        </div>
      </motion.div>
      <motion.div variants={reveal}>
        <h3 className="font-bold text-navy-900 mb-4">Indicateurs — compteurs animés, chiffres réels uniquement</h3>
        <StatsRow />
      </motion.div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 6 — Motion language + limited dark band sample                      */
/* ------------------------------------------------------------------ */
function MotionSection() {
  const [key, setKey] = useState(0);
  const reduce = useReducedMotion();
  const principles = [
    { icon: Zap, title: "Vif, jamais lent", body: "Ressorts fermes (stiffness 380 / damping 28), durées ≤ 500ms. L'interface répond, elle ne se regarde pas bouger." },
    { icon: Sparkles, title: "Entrées orchestrées", body: "Révélation en cascade (60ms d'écart), translation 24px + fondu. Une seule fois par élément — pas de re-déclenchement au scroll." },
    { icon: HeartPulse, title: "Respect de l'utilisateur", body: "prefers-reduced-motion coupe toute animation décorative. Les compteurs affichent la valeur finale, les cartes restent immobiles." },
  ];
  return (
    <Section id="motion" eyebrow="Langage d'animation" title="« Vif & assuré »">
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {principles.map(({ icon: Icon, title, body }) => (
          <motion.div key={title} variants={reveal} className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-tq-50 border border-tq-200">
              <Icon size={20} className="text-tq-700" />
            </div>
            <h3 className="font-[family-name:var(--font-display)] font-bold text-navy-900 mb-2">{title}</h3>
            <p className="text-sm text-navy-600 leading-relaxed">{body}</p>
          </motion.div>
        ))}
      </div>
      <motion.div variants={reveal} className="rounded-2xl border border-navy-100 bg-navy-50/60 p-6 mb-10">
        <div className="mb-5 flex items-center justify-between">
          <p className="font-bold text-navy-900">Démo — cascade d&apos;entrée</p>
          <button onClick={() => setKey((k) => k + 1)}
            className="inline-flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-3.5 py-2 text-sm font-bold text-navy-700 hover:border-navy-400 transition-colors">
            <RotateCcw size={14} /> Rejouer
          </button>
        </div>
        <motion.div key={key} initial={reduce ? false : "hidden"} animate="show" variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Recherche", "Filtres", "Résultats", "Alerte"].map((label) => (
            <motion.div key={label} variants={reveal} className="rounded-xl bg-white border border-navy-100 px-4 py-6 text-center shadow-sm">
              <span className="text-sm font-bold text-tq-700">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* the one sanctioned dark band: recruiter CTA sample */}
      <motion.div variants={reveal}>
        <h3 className="font-bold text-navy-900 mb-4">Bande sombre — usage ponctuel (CTA recruteur, 1 par page max)</h3>
        <div className="relative overflow-hidden rounded-2xl p-8 md:p-10" style={{ background: "var(--gradient-atlas)" }}>
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Cpath d='M64 54l1.7 3.65 3.85.45-2.9 2.85.75 4.05-3.4-1.95-3.4 1.95.75-4.05-2.9-2.85 3.85-.45z' fill='white'/%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div>
              <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-tq-300 mb-2">Vous recrutez ?</p>
              <p className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-white max-w-lg">
                Publiez votre offre, touchez 250 000+ candidats au Maroc.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-navy-700">
              Publier une offre <ArrowRight size={17} />
            </span>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function DesignPreview() {
  return (
    <div className="min-h-screen bg-white">
      <HeroSpecimen />
      <ColorSection />
      <ReperesSection />
      <TypeSection />
      <ComponentsSection />
      <MotionSection />
      <footer className="py-10 text-center text-sm text-navy-300" style={{ background: "var(--gradient-encre)" }}>
        Aperçu interne InteractJob — non indexé · Stage 1 (rev. 2) / direction créative v2
      </footer>
    </div>
  );
}
