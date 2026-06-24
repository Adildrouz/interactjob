"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "@/i18n/routing";

// ── File extraction ───────────────────────────────────────────────────────────
// Uses server-side API for all formats — avoids pdfjs-dist v5 ESM/webpack
// bundling issues that caused silent failures in production.

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

async function extractText(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 25 Mo.`);
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/cv/extract-text", { method: "POST", body: formData });
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || "Impossible de lire ce fichier.");
  }

  return json.text as string;
}

// ── Scoring engine ─────────────────────────────────────────────────────────────

interface Category { name: string; icon: string; score: number; max: number; tips: string[]; }
interface Analysis  { total: number; max: number; wordCount: number; categories: Category[]; keywords: string[]; }

const ACTION_VERBS = [
  "géré","gérée","gérer","développé","développée","créé","créée","mis en place",
  "dirigé","coordonné","optimisé","analysé","conçu","réalisé","assuré","effectué",
  "supervisé","encadré","formé","négocié","planifié","implémenté","déployé",
  "lancé","piloté","réduit","augmenté","amélioré","atteint","obtenu","maintenu",
  "collaboré","élaboré","établi","initié","proposé","accompagné",
];

const SECTION_KW = {
  experience: ["expérience","experience","parcours","emploi","poste","travail","career","work"],
  education:  ["formation","education","études","diplôme","diplome","université","école","master","licence","bac","bts"],
  skills:     ["compétences","competences","skills","techniques","outils","technologies","langues","informatique"],
  summary:    ["profil","résumé","résume","objectif","présentation","about","summary"],
};

const COMMON_KW = [
  "gestion","management","commercial","marketing","finance","comptabilité","informatique",
  "développement","projet","équipe","client","vente","communication","organisation","analyse",
  "stratégie","excel","word","powerpoint","français","anglais","arabe","sql","java","python",
  "react","javascript","php","adobe","crm","erp","sap","agile","scrum",
];

function analyze(text: string): Analysis {
  const lower      = text.toLowerCase();
  const wordCount  = text.split(/\s+/).filter(Boolean).length;
  const categories: Category[] = [];

  // Contact (15)
  const hasEmail    = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone    = /(\+212|0[5-7])[\s.\-]?[\d\s.\-]{8,}/.test(text);
  const hasLinkedIn = /linkedin/i.test(text);
  const hasCity     = /(casablanca|rabat|agadir|tanger|fès|marrakech|meknès|oujda|essaouira|kenitra|salé|maroc)/i.test(text);
  const contactTips: string[] = [];
  if (!hasEmail)    contactTips.push("Ajoutez votre adresse email professionnelle");
  if (!hasPhone)    contactTips.push("Ajoutez votre numéro de téléphone marocain");
  if (!hasLinkedIn) contactTips.push("Mentionnez votre profil LinkedIn");
  if (!hasCity)     contactTips.push("Précisez votre ville (ex: Casablanca, Maroc)");
  categories.push({ name: "Informations de contact", icon: "👤",
    score: (hasEmail?6:0)+(hasPhone?5:0)+(hasLinkedIn?2:0)+(hasCity?2:0), max: 15, tips: contactTips });

  // Structure (25)
  const hasExp     = SECTION_KW.experience.some(k => lower.includes(k));
  const hasEdu     = SECTION_KW.education.some(k => lower.includes(k));
  const hasSkills  = SECTION_KW.skills.some(k => lower.includes(k));
  const hasSummary = SECTION_KW.summary.some(k => lower.includes(k));
  const structTips: string[] = [];
  if (!hasExp)     structTips.push("Ajoutez une section « Expérience professionnelle »");
  if (!hasEdu)     structTips.push("Ajoutez une section « Formation / Diplômes »");
  if (!hasSkills)  structTips.push("Ajoutez une section « Compétences / Skills »");
  if (!hasSummary) structTips.push("Un résumé de profil en tête de CV améliore la lisibilité ATS");
  categories.push({ name: "Structure & Sections", icon: "📋",
    score: (hasExp?10:0)+(hasEdu?8:0)+(hasSkills?5:0)+(hasSummary?2:0), max: 25, tips: structTips });

  // Longueur (15)
  let lengthScore = 0; const lengthTips: string[] = [];
  if      (wordCount >= 300 && wordCount <= 700) lengthScore = 15;
  else if (wordCount >= 250)                     { lengthScore = 10; lengthTips.push(`CV légèrement hors plage (${wordCount} mots). Idéal : 300–700 mots.`); }
  else if (wordCount >= 150)                     { lengthScore = 5;  lengthTips.push(`CV trop court (${wordCount} mots). Détaillez vos expériences.`); }
  else                                           { lengthScore = 2;  lengthTips.push(`CV très insuffisant (${wordCount} mots). Ajoutez beaucoup plus de contenu.`); }
  categories.push({ name: "Longueur du contenu", icon: "📏", score: lengthScore, max: 15, tips: lengthTips });

  // Verbes (15)
  const verbCount = ACTION_VERBS.filter(v => lower.includes(v)).length;
  const verbScore = verbCount >= 6 ? 15 : verbCount >= 4 ? 10 : verbCount >= 2 ? 6 : verbCount >= 1 ? 3 : 0;
  const verbTips: string[] = [];
  if (verbCount === 0) verbTips.push("Aucun verbe d'action détecté. Commencez vos lignes par : géré, développé, créé, optimisé…");
  else if (verbCount < 4) verbTips.push(`${verbCount} verbe(s) d'action trouvé(s). Enrichissez : lancé, coordonné, piloté, amélioré…`);
  categories.push({ name: "Verbes d'action", icon: "💪", score: verbScore, max: 15, tips: verbTips });

  // Compat ATS (15)
  const hasSpecial  = /[|▪▸►◄◆◇★☆✓✗✔✘⚡]/.test(text);
  const hasTable    = /\t{2,}|\|[\s\-]+\|/.test(text);
  const hasDates    = /\d{4}|\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|jan|fév|mar|avr|aoû|sep|oct|nov|déc)\b/i.test(text);
  const hasNumbers  = /\d+\s*(%|clients|projets|personnes|collaborateurs|k€|mad|dh)/i.test(text);
  const atsTips: string[] = [];
  if (hasSpecial)  atsTips.push("Supprimez les symboles spéciaux (★, ◆, ✓) — ils bloquent les parseurs ATS");
  if (hasTable)    atsTips.push("Les tableaux ne sont pas lus par les ATS. Utilisez du texte simple.");
  if (!hasDates)   atsTips.push("Ajoutez des dates à chaque expérience (ex: Jan 2022 – Déc 2023)");
  if (!hasNumbers) atsTips.push("Quantifiez vos résultats (ex: +20% CA, 5 projets livrés, 8 collaborateurs)");
  categories.push({ name: "Compatibilité ATS", icon: "🤖",
    score: (!hasSpecial?5:0)+(!hasTable?5:0)+(hasDates?3:0)+(hasNumbers?2:0), max: 15, tips: atsTips });

  // Mots-clés (15)
  const keywords = COMMON_KW.filter(k => lower.includes(k));
  const kwScore  = keywords.length >= 8 ? 15 : keywords.length >= 5 ? 10 : keywords.length >= 3 ? 6 : keywords.length >= 1 ? 3 : 0;
  const kwTips: string[] = [];
  if (keywords.length < 5) kwTips.push("Ajoutez des mots-clés de votre secteur : outils, logiciels, compétences spécifiques");
  kwTips.push("Adaptez toujours vos mots-clés à chaque offre ciblée");
  categories.push({ name: "Mots-clés métier", icon: "🔍", score: kwScore, max: 15, tips: kwTips });

  return { total: categories.reduce((s,c)=>s+c.score,0), max: categories.reduce((s,c)=>s+c.max,0), wordCount, categories, keywords };
}

// ── Score ring animation hook ─────────────────────────────────────────────────

function useCounter(target: number, active: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0; const duration = 1200;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      setVal(Math.round(pct * pct * target));
      if (pct < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active]);
  return val;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function grade(pct: number) {
  if (pct >= 80) return { label: "Excellent",  ring: "#10b981", bg: "from-emerald-500 to-teal-500",    pill: "bg-emerald-100 text-emerald-700 border-emerald-300" };
  if (pct >= 60) return { label: "Bon",        ring: "#3b82f6", bg: "from-blue-500 to-indigo-500",     pill: "bg-blue-100 text-blue-700 border-blue-300"          };
  if (pct >= 40) return { label: "Moyen",      ring: "#f59e0b", bg: "from-amber-400 to-orange-500",    pill: "bg-amber-100 text-amber-700 border-amber-300"       };
  return             { label: "À améliorer", ring: "#ef4444", bg: "from-red-500 to-rose-500",       pill: "bg-red-100 text-red-700 border-red-300"             };
}

function catColor(pct: number) {
  if (pct >= 80) return { bar: "from-emerald-400 to-teal-500",  text: "text-emerald-600" };
  if (pct >= 60) return { bar: "from-blue-400 to-indigo-500",   text: "text-blue-600"    };
  if (pct >= 40) return { bar: "from-amber-400 to-orange-400",  text: "text-amber-600"   };
  return             { bar: "from-red-400 to-rose-500",      text: "text-red-600"     };
}

const LOADING_STEPS = [
  "Lecture du fichier…",
  "Extraction du texte…",
  "Analyse des sections…",
  "Calcul du score ATS…",
  "Génération du rapport…",
];

// ── Page component ────────────────────────────────────────────────────────────

type Phase = "upload" | "loading" | "result";

export default function CVCheckerPage() {
  const [phase,        setPhase]       = useState<Phase>("upload");
  const [dragging,     setDragging]    = useState(false);
  const [fileName,     setFileName]    = useState("");
  const [fileType,     setFileType]    = useState("");
  const [loadStep,     setLoadStep]    = useState(0);
  const [result,       setResult]      = useState<Analysis | null>(null);
  const [error,        setError]       = useState("");
  const inputRef                       = useRef<HTMLInputElement>(null);
  const resultRef                      = useRef<HTMLDivElement>(null);

  const pct      = result ? Math.round((result.total / result.max) * 100) : 0;
  const g        = grade(pct);
  const animated = useCounter(result?.total ?? 0, phase === "result");

  // SVG ring
  const R = 70; const CIRC = 2 * Math.PI * R;
  const animDash = result ? (CIRC * (animated / result.max)) : 0;

  async function processFile(file: File) {
    const allowed = [".pdf",".doc",".docx"];
    if (!allowed.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setError("Format non supporté. Utilisez un fichier PDF, DOC ou DOCX.");
      return;
    }
    setError("");
    setFileName(file.name);
    setFileType(file.name.split(".").pop()?.toUpperCase() ?? "");
    setLoadStep(0);
    setPhase("loading");

    // Animate steps while extracting
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setLoadStep(s => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 480);

    try {
      const text = await extractText(file);
      clearInterval(interval);
      setLoadStep(LOADING_STEPS.length - 1);
      await new Promise(r => setTimeout(r, 400));
      const analysis = analyze(text);
      setResult(analysis);
      setPhase("result");
      // Silent tracking — never blocks UX
      fetch('/api/cv/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: analysis.total,
          maxScore: analysis.max,
          wordCount: analysis.wordCount,
          locale: document.documentElement.lang || 'fr',
        }),
      }).catch(() => {});
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      clearInterval(interval);
      setError(e?.message || "Impossible de lire ce fichier. Essayez un autre format.");
      setPhase("upload");
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave = ()                      => setDragging(false);
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <>
      <style>{`
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes glow   { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes slideUp{ from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dash   { to{stroke-dashoffset:0} }
        @keyframes spin2  { to{transform:rotate(360deg)} }
        .float-icon   { animation: float 3s ease-in-out infinite; }
        .glow-ring    { animation: glow 2s ease-in-out infinite; }
        .slide-up     { animation: slideUp .5s ease both; }
      `}</style>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] text-white py-16 px-4">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 40%)" }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-4 py-1.5 rounded-full mb-5 backdrop-blur-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" style={{ animation: "glow 2s ease-in-out infinite" }} />
            Outil 100% gratuit · Aucune inscription
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
            Testez votre CV contre<br />
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              les filtres ATS
            </span>
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">
            80% des CV sont éliminés avant d'être lus. Obtenez votre score en 30 secondes
            — votre fichier reste sur votre appareil.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* ── PHASE : UPLOAD ── */}
        {phase === "upload" && (
          <div className="slide-up">
            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`relative rounded-3xl cursor-pointer transition-all duration-300 overflow-hidden
                ${dragging
                  ? "border-2 border-violet-500 bg-violet-50 scale-[1.02] shadow-2xl shadow-violet-200"
                  : "border-2 border-dashed border-gray-200 bg-white hover:border-violet-400 hover:shadow-xl hover:shadow-violet-100"
                }`}
            >
              {/* Gradient top bar */}
              <div className={`h-1.5 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 transition-opacity ${dragging ? "opacity-100" : "opacity-30"}`} />

              <div className="px-8 py-16 flex flex-col items-center gap-6 text-center">
                {/* Animated icon */}
                <div className="float-icon">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-300">
                      <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full flex items-center justify-center shadow-md">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xl font-bold text-gray-900 mb-1">
                    {dragging ? "Relâchez pour analyser" : "Glissez votre CV ici"}
                  </p>
                  <p className="text-gray-400 text-sm">ou cliquez pour choisir un fichier</p>
                </div>

                {/* Format badges */}
                <div className="flex items-center gap-3">
                  {[
                    { ext: "PDF",  color: "bg-red-100 text-red-600 border-red-200" },
                    { ext: "DOCX", color: "bg-blue-100 text-blue-600 border-blue-200" },
                    { ext: "DOC",  color: "bg-sky-100 text-sky-600 border-sky-200"  },
                  ].map(({ ext, color }) => (
                    <span key={ext} className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${color}`}>{ext}</span>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:scale-105 transition-all duration-200"
                >
                  Choisir mon CV →
                </button>
                <p className="text-xs text-gray-400">Fichier max 25 Mo · Votre CV ne quitte jamais votre navigateur</p>
              </div>

              <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onFileChange} />
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            {/* Info cards */}
            <div className="grid grid-cols-3 gap-4 mt-10">
              {[
                { icon: "🤖", title: "Qu'est-ce qu'un ATS ?",    desc: "Un logiciel qui filtre les CV automatiquement. 75% des entreprises en utilisent un." },
                { icon: "📊", title: "6 critères analysés",      desc: "Contact, structure, longueur, verbes d'action, formatage, mots-clés métier." },
                { icon: "🎯", title: "Conseils personnalisés",   desc: "Des recommandations concrètes pour maximiser vos chances d'être sélectionné." },
              ].map(item => (
                <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="text-xs font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PHASE : LOADING ── */}
        {phase === "loading" && (
          <div className="slide-up bg-white rounded-3xl border border-gray-100 shadow-xl p-12 text-center">
            {/* Spinner */}
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
                <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-purple-500 border-transparent"
                  style={{ animation: "spin2 .8s linear infinite" }} />
                <div className="absolute inset-3 rounded-full border-4 border-t-pink-400 border-transparent"
                  style={{ animation: "spin2 1.2s linear infinite reverse" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">
                    {fileType === "PDF" ? "📄" : "📝"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">Analyse en cours</p>
            <p className="text-gray-900 font-bold text-lg mb-1 truncate max-w-xs mx-auto">{fileName}</p>
            <p className="text-violet-600 text-sm font-medium mb-8">{LOADING_STEPS[loadStep]}</p>

            {/* Step progress */}
            <div className="space-y-3 max-w-xs mx-auto">
              {LOADING_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    i < loadStep  ? "bg-emerald-500"
                    : i === loadStep ? "bg-violet-500"
                    : "bg-gray-100"
                  }`}>
                    {i < loadStep
                      ? <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                      : i === loadStep
                      ? <div className="w-2 h-2 bg-white rounded-full" style={{ animation: "glow 1s ease-in-out infinite" }} />
                      : <div className="w-2 h-2 bg-gray-300 rounded-full" />
                    }
                  </div>
                  <span className={`text-sm transition-colors ${i <= loadStep ? "text-gray-800 font-medium" : "text-gray-300"}`}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PHASE : RESULT ── */}
        {phase === "result" && result && (
          <div ref={resultRef} className="space-y-6">

            {/* Score hero card */}
            <div className="slide-up bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
              <div className={`h-2 bg-gradient-to-r ${g.bg}`} />
              <div className="p-8 flex flex-col sm:flex-row items-center gap-8">

                {/* SVG ring */}
                <div className="flex-shrink-0">
                  <svg width="180" height="180" viewBox="0 0 180 180">
                    <circle cx="90" cy="90" r={R} fill="none" stroke="#f3f4f6" strokeWidth="14" />
                    <circle cx="90" cy="90" r={R} fill="none"
                      stroke={g.ring} strokeWidth="14"
                      strokeDasharray={`${animDash} ${CIRC}`}
                      strokeLinecap="round"
                      transform="rotate(-90 90 90)"
                      style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }}
                    />
                    <text x="90" y="82"  textAnchor="middle" fontSize="36" fontWeight="800" fill={g.ring}>{animated}</text>
                    <text x="90" y="100" textAnchor="middle" fontSize="13" fill="#9ca3af">/ {result.max}</text>
                    <text x="90" y="118" textAnchor="middle" fontSize="11" fill="#d1d5db">{result.wordCount} mots</text>
                  </svg>
                </div>

                {/* Text */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-3 justify-center sm:justify-start mb-3">
                    <span className="text-3xl font-extrabold text-gray-900">Score ATS : {pct}%</span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full border ${g.pill}`}>{g.label}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-5">
                    {pct >= 80 ? "Excellent ! Votre CV est bien optimisé pour les systèmes ATS."
                    : pct >= 60 ? "Bon score. Quelques ajustements peuvent encore vous démarquer."
                    : pct >= 40 ? "Score moyen. Suivez les conseils ci-dessous pour dépasser les filtres."
                    : "Votre CV risque d'être éliminé automatiquement. Appliquez les corrections urgentes."}
                  </p>

                  {/* Keywords found */}
                  {result.keywords.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Mots-clés détectés</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.keywords.slice(0, 10).map(kw => (
                          <span key={kw} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-full">{kw}</span>
                        ))}
                        {result.keywords.length > 10 && <span className="text-xs text-gray-400 self-center">+{result.keywords.length - 10}</span>}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => { setPhase("upload"); setResult(null); setFileName(""); setError(""); }}
                      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      Autre CV
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Score-based CV Pro CTA ── */}
            {pct < 70 ? (
              <div className="slide-up rounded-2xl border-2 border-red-400 bg-[#FEE2E2] p-5" style={{ animationDelay: "200ms" }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-extrabold text-red-800 text-base mb-1">
                      ⚠️ Score : {pct}/100 — Votre CV risque d'être éliminé par les filtres ATS
                    </p>
                    <p className="text-sm text-red-700">
                      💡 Recréez votre CV en 3 minutes avec notre générateur IA — <strong>seulement 5€</strong>
                    </p>
                  </div>
                  <Link
                    href={"/generateur-cv" as any}
                    className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md whitespace-nowrap"
                  >
                    Créer mon CV IA →
                  </Link>
                </div>
              </div>
            ) : pct <= 85 ? (
              <div className="slide-up rounded-2xl border-2 border-amber-400 bg-[#FEF3C7] p-5" style={{ animationDelay: "200ms" }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-extrabold text-amber-800 text-base mb-1">
                      🟡 Score : {pct}/100 — Votre CV peut encore être amélioré
                    </p>
                    <p className="text-sm text-amber-700">
                      💡 Améliorez votre CV en 3 min avec notre générateur IA — <strong>seulement 5€</strong>
                    </p>
                  </div>
                  <Link
                    href={"/generateur-cv" as any}
                    className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md whitespace-nowrap"
                  >
                    Générer mon CV IA →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="slide-up rounded-2xl border-2 border-[#0EA86A] bg-[#E6F7F0] p-5" style={{ animationDelay: "200ms" }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-extrabold text-emerald-800 text-base mb-1">
                      ✅ Bon score ! Vous pouvez encore le perfectionner avec notre service expert
                    </p>
                    <p className="text-sm text-emerald-700">
                      Améliorez encore votre CV avec notre générateur IA — <strong>seulement 5€</strong>
                    </p>
                  </div>
                  <Link
                    href={"/generateur-cv" as any}
                    className="flex-shrink-0 bg-[#0EA86A] hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-md whitespace-nowrap"
                  >
                    Générer mon CV IA →
                  </Link>
                </div>
              </div>
            )}

            {/* Category cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.categories.map((cat, idx) => {
                const catPct = Math.round((cat.score / cat.max) * 100);
                const cc = catColor(catPct);
                return (
                  <div key={cat.name} className="slide-up bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5 overflow-hidden"
                    style={{ animationDelay: `${idx * 80}ms` }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${cc.text}`}>{cat.score}/{cat.max}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                      <div className={`h-2 rounded-full bg-gradient-to-r ${cc.bar} transition-all duration-1000`}
                        style={{ width: `${catPct}%`, transitionDelay: `${idx * 80 + 300}ms` }} />
                    </div>

                    {cat.tips.length === 0
                      ? <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                          Bien optimisé
                        </p>
                      : <ul className="space-y-1.5">
                          {cat.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                              <span className="text-violet-400 mt-0.5 flex-shrink-0 font-bold">→</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                    }
                  </div>
                );
              })}
            </div>

            {/* CTA banner */}
            <div className="slide-up rounded-3xl overflow-hidden" style={{ animationDelay: "500ms" }}>
              <div className="bg-gradient-to-r from-[#0f172a] via-[#1e1b4b] to-[#312e81] p-8 text-center text-white">
                <p className="text-xl font-extrabold mb-2">Votre CV est prêt ? Trouvez votre poste !</p>
                <p className="text-white/60 text-sm mb-6">Des centaines d'offres CDI, CDD et Stage au Maroc — filtrées par secteur et ville.</p>
                <Link href="/offres"
                  className="inline-block bg-white text-[#1e1b4b] font-bold px-8 py-3 rounded-xl text-sm hover:scale-105 transition-transform shadow-xl"
                >
                  Voir les offres d'emploi →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
