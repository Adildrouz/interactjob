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
  Landmark,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Shared motion vocabulary — "vif & assuré" (snappy, confident)      */
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

function Section({
  id,
  eyebrow,
  title,
  children,
  dark = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section id={id} className={`py-20 px-6 ${dark ? "bg-navy-950" : ""}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
        >
          <motion.p
            variants={reveal}
            className="text-[13px] font-bold uppercase tracking-[0.14em] text-tq-600 mb-2"
          >
            {eyebrow}
          </motion.p>
          <motion.h2
            variants={reveal}
            className={`font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold tracking-tight mb-10 ${
              dark ? "text-white" : "text-navy-900"
            }`}
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
/* 1 — Hero specimen                                                   */
/* ------------------------------------------------------------------ */
function HeroSpecimen() {
  const reduce = useReducedMotion();
  return (
    <header className="relative overflow-hidden bg-navy-950 text-white">
      {/* aurora glows */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px 420px at 18% -10%, rgba(0,194,203,0.22), transparent 60%), radial-gradient(700px 380px at 85% 8%, rgba(123,92,250,0.16), transparent 55%), radial-gradient(600px 300px at 60% 110%, rgba(255,107,69,0.10), transparent 60%)",
        }}
      />
      {/* dotted grid texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.14] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "linear-gradient(to bottom, black, transparent 75%)",
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-28">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div
            variants={reveal}
            className="inline-flex items-center gap-2 rounded-full border border-tq-500/40 bg-tq-500/10 px-4 py-1.5 text-sm font-semibold text-tq-300 mb-7"
          >
            <span className="relative flex h-2 w-2">
              {!reduce && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tq-400 opacity-75" />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-tq-400" />
            </span>
            Direction créative v2 — aperçu interne
          </motion.div>

          <motion.h1
            variants={reveal}
            className="font-[family-name:var(--font-display)] text-5xl md:text-7xl font-bold tracking-tight leading-[1.02] max-w-3xl"
          >
            L&apos;emploi au Maroc,{" "}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(100deg,#2AD5DD,#00C2CB 45%,#7B5CFA)" }}
            >
              en grand.
            </span>
          </motion.h1>

          <motion.p variants={reveal} className="mt-6 text-lg text-navy-200 max-w-xl leading-relaxed">
            Une identité vive et assumée, construite sur le navy&nbsp;
            <code className="text-tq-300">#00347A</code>{" "}et le turquoise&nbsp;
            <code className="text-tq-300">#00C2CB</code>{" "}— énergie de startup, confiance
            d&apos;institution.
          </motion.p>

          <motion.div variants={reveal} className="mt-9 flex flex-wrap items-center gap-4">
            <motion.a
              whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING}
              href="#couleurs"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white shadow-[0_10px_30px_-8px_rgba(255,107,69,0.55)]"
              style={{ background: "var(--gradient-solaire)" }}
            >
              Explorer la direction <ArrowRight size={18} />
            </motion.a>
            <motion.a
              whileHover={reduce ? undefined : { y: -2 }}
              transition={SPRING}
              href="#composants"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 font-bold text-white backdrop-blur-sm hover:bg-white/15 transition-colors"
            >
              Voir les composants
            </motion.a>
          </motion.div>

          {/* floating proof chips */}
          <motion.div variants={reveal} className="mt-14 flex flex-wrap gap-3">
            {[
              { icon: Briefcase, label: "Offres vérifiées chaque jour" },
              { icon: Landmark, label: "Concours publics officiels" },
              { icon: Sparkles, label: "Outils IA candidats" },
            ].map(({ icon: Icon, label }, i) => (
              <motion.span
                key={label}
                animate={reduce ? undefined : { y: [0, -6, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-sm font-medium text-navy-100 backdrop-blur-sm"
              >
                <Icon size={15} className="text-tq-400" /> {label}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>
      {/* bottom curve into white */}
      <svg aria-hidden viewBox="0 0 1440 64" className="block w-full text-white" preserveAspectRatio="none" style={{ height: 48 }}>
        <path fill="currentColor" d="M0 64h1440V22C1180 54 900 64 720 64 540 64 260 54 0 22v42Z" />
      </svg>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* 2 — Color system                                                    */
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
    <Section id="couleurs" eyebrow="Système de couleurs" title="Deux couleurs de marque, tout un langage">
      <motion.div variants={reveal} className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl p-8 text-white relative overflow-hidden" style={{ background: "#00347A" }}>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold">Navy — l&apos;autorité</p>
          <p className="text-navy-200 mt-1 font-mono text-sm">#00347A · inchangé, désormais central</p>
        </div>
        <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: "#00C2CB" }}>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy-900">Turquoise — l&apos;énergie</p>
          <p className="text-navy-800/70 mt-1 font-mono text-sm">#00C2CB · inchangé, désormais visible</p>
        </div>
      </motion.div>

      <motion.div variants={reveal} className="grid grid-cols-6 md:grid-cols-11 gap-2 mb-2">
        {NAVY.map(([n, h]) => <Swatch key={n} name={n} hex={h} />)}
      </motion.div>
      <motion.div variants={reveal} className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-10">
        {TQ.map(([n, h]) => <Swatch key={n} name={n} hex={h} />)}
      </motion.div>

      <motion.div variants={reveal} className="grid md:grid-cols-3 gap-6 mb-10">
        <div>
          <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2"><Flame size={16} className="text-coral-500" /> Accent chaud — CTA & urgence</h3>
          <div className="grid grid-cols-3 gap-2">
            <Swatch name="coral-500" hex="#FF6B45" />
            <Swatch name="coral-600" hex="#E84E2B" />
            <Swatch name="sun-500" hex="#FFB93D" />
          </div>
          <p className="text-sm text-navy-600/80 mt-3 leading-relaxed">
            Le corail est réservé aux actions (postuler, s&apos;alerter) et à l&apos;urgence (deadlines).
            Sa rareté fait sa force.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2"><Sparkles size={16} className="text-violet-ij-500" /> Décoratif</h3>
          <div className="grid grid-cols-3 gap-2">
            <Swatch name="violet-500" hex="#7B5CFA" />
            <Swatch name="violet-100" hex="#EAE4FF" />
            <Swatch name="sun-100" hex="#FFF1D6" />
          </div>
          <p className="text-sm text-navy-600/80 mt-3 leading-relaxed">
            Le violet n&apos;apparaît que dans les dégradés et illustrations — jamais en aplat fonctionnel.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2"><Check size={16} className="text-success" /> Sémantique</h3>
          <div className="grid grid-cols-3 gap-2">
            <Swatch name="success" hex="#0CAE7D" />
            <Swatch name="warning" hex="#F5A623" />
            <Swatch name="error" hex="#D92D20" />
          </div>
          <p className="text-sm text-navy-600/80 mt-3 leading-relaxed">
            Accordés à la famille : un vert lagon, un ambre solaire, un rouge distinct du corail CTA.
          </p>
        </div>
      </motion.div>

      <motion.div variants={reveal}>
        <h3 className="font-bold text-navy-900 mb-3">Dégradés signature</h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            ["Atlas", "var(--gradient-atlas)", "héros, bandeaux"],
            ["Lagon", "var(--gradient-lagon)", "badges, highlights"],
            ["Solaire", "var(--gradient-solaire)", "CTA primaires"],
            ["Encre", "var(--gradient-encre)", "fonds sombres"],
          ].map(([name, bg, usage]) => (
            <div key={name} className="h-28 rounded-2xl p-4 flex flex-col justify-end" style={{ background: bg }}>
              <span className="font-[family-name:var(--font-display)] font-bold text-white">{name}</span>
              <span className="text-xs text-white/75">{usage}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 3 — Typography                                                      */
/* ------------------------------------------------------------------ */
function TypeSection() {
  return (
    <Section id="typo" eyebrow="Typographie" title="Bricolage Grotesque × Plus Jakarta Sans">
      <div className="grid md:grid-cols-2 gap-10">
        <motion.div variants={reveal}>
          <p className="text-sm font-bold text-tq-600 uppercase tracking-wider mb-3">Titres — Bricolage Grotesque</p>
          <p className="font-[family-name:var(--font-display)] text-6xl font-bold tracking-tight text-navy-900 leading-[1.05]">
            Trouvez le job qui vous ressemble
          </p>
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-navy-700 mt-6">
            Une grotesque à caractère — géométrique mais chaleureuse, taillée pour l&apos;écran.
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
          <p className="text-sm font-bold text-tq-600 uppercase tracking-wider mb-3">Corps — Plus Jakarta Sans (déjà en place)</p>
          <p className="text-navy-800 leading-relaxed">
            Le corps de texte reste en Plus Jakarta Sans : moderne, lisible, déjà chargé sur tout le
            site — zéro coût de performance ajouté. La hiérarchie naît du contraste entre la
            grotesque expressive des titres et la neutralité élégante du corps.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-navy-700">
            <li className="flex gap-2"><Check size={16} className="text-success mt-0.5 shrink-0" /> Échelle : 13 / 15 / 17 / 20 / 24 / 34 / 48 / 64px — ratio ~1.25</li>
            <li className="flex gap-2"><Check size={16} className="text-success mt-0.5 shrink-0" /> Titres : tracking -0.02em, graisse 700-800</li>
            <li className="flex gap-2"><Check size={16} className="text-success mt-0.5 shrink-0" /> Eyebrows : 13px, 700, +0.14em, turquoise-600</li>
          </ul>
          <div dir="rtl" className="mt-6 rounded-2xl bg-navy-50 p-5">
            <p className="text-sm font-bold text-tq-700 mb-1">العربية — RTL</p>
            <p className="font-bold text-2xl text-navy-900">ابحث عن وظيفتك المثالية في المغرب</p>
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
/* 4 — Components                                                      */
/* ------------------------------------------------------------------ */
function Buttons() {
  const reduce = useReducedMotion();
  const base = "inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-[15px]";
  const hover = reduce ? undefined : { y: -2, scale: 1.02 };
  return (
    <div className="flex flex-wrap items-center gap-4">
      <motion.button whileHover={hover} whileTap={{ scale: 0.97 }} transition={SPRING}
        className={`${base} text-white shadow-[0_10px_26px_-8px_rgba(255,107,69,0.6)]`}
        style={{ background: "var(--gradient-solaire)" }}>
        Postuler maintenant <ArrowRight size={17} />
      </motion.button>
      <motion.button whileHover={hover} whileTap={{ scale: 0.97 }} transition={SPRING}
        className={`${base} bg-navy-700 text-white shadow-[0_10px_26px_-10px_rgba(0,52,122,0.55)]`}>
        Rechercher <Search size={17} />
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
  );
}

function JobCardDemo() {
  const reduce = useReducedMotion();
  const [saved, setSaved] = useState(false);
  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -5 }}
      transition={SPRING}
      className="group relative rounded-2xl border border-navy-100 bg-white p-5 shadow-sm hover:shadow-[0_24px_50px_-24px_rgba(0,52,122,0.35)] transition-shadow duration-300"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: "var(--gradient-lagon)" }} />
      <div className="flex items-start gap-3.5">
        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-xl font-[family-name:var(--font-display)] text-lg font-bold text-white"
          style={{ background: "var(--gradient-atlas)", width: 52, height: 52 }}>
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
        <span className="rounded-full bg-violet-ij-100 px-3 py-1 text-xs font-bold" style={{ color: "#5B41D6" }}>React</span>
        <span className="rounded-full bg-sun-100 px-3 py-1 text-xs font-bold text-navy-800">Node.js</span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-navy-50 pt-4">
        <div>
          <p className="font-[family-name:var(--font-display)] font-bold text-navy-900">18 000 – 25 000 <span className="text-xs font-semibold text-navy-500">MAD/mois</span></p>
          <p className="text-xs text-navy-400">il y a 2 jours</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: "var(--gradient-solaire)" }}>
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
      className="group relative rounded-2xl border border-coral-100 bg-white p-5 shadow-sm hover:shadow-[0_24px_50px_-24px_rgba(232,78,43,0.3)] transition-shadow duration-300"
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: "var(--gradient-solaire)" }} />
      <div className="flex items-start gap-3.5">
        <div className="relative flex shrink-0 items-center justify-center rounded-xl text-white" style={{ background: "var(--gradient-atlas)", width: 52, height: 52 }}>
          <Landmark size={24} />
          <svg width={10} height={10} viewBox="0 0 24 24" fill="#FFB93D" className="absolute top-1 right-1" aria-hidden>
            <path d="M12 2l2.9 6.26L21.5 9l-5 4.9 1.3 6.9L12 17.4 6.2 20.8l1.3-6.9-5-4.9 6.6-.74z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-1 inline-block rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy-600">Ministère</span>
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-coral-50 px-3 py-1.5 text-xs font-bold text-coral-600">
          <CalendarClock size={13} />
          <span className="tabular-nums">J-5</span> — 27 juillet
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
        <div key={s.label} className="rounded-2xl border border-navy-100 bg-gradient-to-b from-white to-navy-50/60 p-5 text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-transparent bg-clip-text tabular-nums"
            style={{ backgroundImage: "linear-gradient(120deg,#00347A,#00A8B1)" }}>
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
    <Section id="composants" eyebrow="Composants" title="Le style appliqué aux patterns clés">
      <motion.div variants={reveal} className="mb-10">
        <h3 className="font-bold text-navy-900 mb-4">Boutons</h3>
        <Buttons />
      </motion.div>
      <motion.div variants={reveal} className="mb-10 grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold text-navy-900 mb-4">Carte offre d&apos;emploi</h3>
          <JobCardDemo />
        </div>
        <div>
          <h3 className="font-bold text-navy-900 mb-4">Carte concours (urgence)</h3>
          <ConcoursCardDemo />
        </div>
      </motion.div>
      <motion.div variants={reveal}>
        <h3 className="font-bold text-navy-900 mb-4">Indicateurs — compteurs animés</h3>
        <StatsRow />
      </motion.div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* 5 — Motion language                                                 */
/* ------------------------------------------------------------------ */
function MotionSection() {
  const [key, setKey] = useState(0);
  const reduce = useReducedMotion();
  const principles = [
    { icon: Zap, title: "Vif, jamais lent", body: "Ressorts fermes (stiffness 380 / damping 28), durées ≤ 500ms. L'interface répond, elle ne se regarde pas bouger." },
    { icon: Sparkles, title: "Entrées orchestrées", body: "Révélation en cascade (60ms d'écart), translation 24px + fondu. Une seule fois par élément — pas de re-déclenchement au scroll." },
    { icon: Check, title: "Respect de l'utilisateur", body: "prefers-reduced-motion coupe toute animation décorative. Les compteurs affichent la valeur finale, les cartes restent immobiles." },
  ];
  return (
    <Section id="motion" eyebrow="Langage d'animation" title="« Vif & assuré »" dark>
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {principles.map(({ icon: Icon, title, body }) => (
          <motion.div key={title} variants={reveal} className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "var(--gradient-lagon)" }}>
              <Icon size={20} className="text-navy-900" />
            </div>
            <h3 className="font-[family-name:var(--font-display)] font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-navy-200 leading-relaxed">{body}</p>
          </motion.div>
        ))}
      </div>
      <motion.div variants={reveal} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="font-bold text-white">Démo — cascade d&apos;entrée</p>
          <button onClick={() => setKey((k) => k + 1)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3.5 py-2 text-sm font-bold text-white hover:bg-white/10 transition-colors">
            <RotateCcw size={14} /> Rejouer
          </button>
        </div>
        <motion.div key={key} initial={reduce ? false : "hidden"} animate="show" variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Recherche", "Filtres", "Résultats", "Alerte"].map((label) => (
            <motion.div key={label} variants={reveal} className="rounded-xl bg-white/[0.08] border border-white/10 px-4 py-6 text-center">
              <span className="text-sm font-bold text-tq-300">{label}</span>
            </motion.div>
          ))}
        </motion.div>
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
      <div className="h-px bg-navy-100 max-w-6xl mx-auto" />
      <TypeSection />
      <div className="h-px bg-navy-100 max-w-6xl mx-auto" />
      <ComponentsSection />
      <MotionSection />
      <footer className="py-10 text-center text-sm text-navy-400 bg-navy-950">
        Aperçu interne InteractJob — non indexé · Stage 1 / direction créative v2
      </footer>
    </div>
  );
}
