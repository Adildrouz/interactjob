"use client";
import { useState, useRef } from "react";
import { Link } from "@/i18n/routing";

// ── Scoring engine ────────────────────────────────────────────────────────────

interface Category {
  name: string;
  icon: string;
  score: number;
  max: number;
  tips: string[];
}

interface Analysis {
  total: number;
  maxTotal: number;
  wordCount: number;
  categories: Category[];
  foundKeywords: string[];
}

const ACTION_VERBS = [
  "géré","gérée","gérer","développé","développée","créé","créée","mis en place",
  "dirigé","coordonné","optimisé","analysé","conçu","réalisé","assuré","effectué",
  "supervisé","encadré","formé","négocié","planifié","implémenté","déployé",
  "lancé","piloté","réduit","augmenté","amélioré","atteint","obtenu","maintenu",
  "collaboré","élaboré","établi","initié","proposé","accompagné","piloté",
];

const SECTION_KW = {
  experience: ["expérience","experience","parcours","emploi","poste","travail","career","work history"],
  education:  ["formation","education","études","diplôme","diplome","université","école","master","licence","bac","bts","doctorat"],
  skills:     ["compétences","competences","skills","techniques","outils","technologies","langues","languages","informatique"],
  summary:    ["profil","résumé","résume","objectif","présentation","about","summary","introduction"],
};

const COMMON_KW = [
  "gestion","management","commercial","marketing","finance","comptabilité",
  "informatique","développement","projet","équipe","client","vente","communication",
  "organisation","analyse","stratégie","excel","word","powerpoint","français",
  "anglais","arabe","sql","java","python","react","javascript","php","adobe",
  "crm","erp","sap","autocad","solidworks","agile","scrum",
];

function analyzeCV(text: string): Analysis {
  const lower = text.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const categories: Category[] = [];

  // 1. Contact (15 pts)
  const hasEmail    = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text);
  const hasPhone    = /(\+212|0[5-7])[\s.\-]?[\d\s.\-]{8,}|\d{2}[\s.\-]\d{2}[\s.\-]\d{2}[\s.\-]\d{2}[\s.\-]\d{2}/.test(text);
  const hasLinkedIn = /linkedin\.com|linkedin/i.test(text);
  const hasCity     = /(casablanca|rabat|agadir|tanger|fès|marrakech|meknès|oujda|essaouira|kenitra|salé|mohammedia|maroc|morocco)/i.test(text);
  const contactScore = (hasEmail ? 6 : 0) + (hasPhone ? 5 : 0) + (hasLinkedIn ? 2 : 0) + (hasCity ? 2 : 0);
  const contactTips: string[] = [];
  if (!hasEmail)    contactTips.push("Ajoutez votre adresse email professionnelle");
  if (!hasPhone)    contactTips.push("Ajoutez votre numéro de téléphone marocain");
  if (!hasLinkedIn) contactTips.push("Mentionnez votre URL LinkedIn (linkedin.com/in/…)");
  if (!hasCity)     contactTips.push("Précisez votre ville (ex: Casablanca, Maroc)");
  categories.push({ name: "Informations de contact", icon: "👤", score: contactScore, max: 15, tips: contactTips });

  // 2. Structure (25 pts)
  const hasExp     = SECTION_KW.experience.some(k => lower.includes(k));
  const hasEdu     = SECTION_KW.education.some(k => lower.includes(k));
  const hasSkills  = SECTION_KW.skills.some(k => lower.includes(k));
  const hasSummary = SECTION_KW.summary.some(k => lower.includes(k));
  const structScore = (hasExp ? 10 : 0) + (hasEdu ? 8 : 0) + (hasSkills ? 5 : 0) + (hasSummary ? 2 : 0);
  const structTips: string[] = [];
  if (!hasExp)     structTips.push("Ajoutez une section « Expérience professionnelle »");
  if (!hasEdu)     structTips.push("Ajoutez une section « Formation / Diplômes »");
  if (!hasSkills)  structTips.push("Ajoutez une section « Compétences / Skills »");
  if (!hasSummary) structTips.push("Un résumé de profil en tête de CV améliore la lisibilité ATS");
  categories.push({ name: "Structure & Sections", icon: "📋", score: structScore, max: 25, tips: structTips });

  // 3. Longueur (15 pts)
  let lengthScore = 0;
  const lengthTips: string[] = [];
  if      (wordCount >= 300 && wordCount <= 700) lengthScore = 15;
  else if (wordCount >= 250 && wordCount <  300) { lengthScore = 10; lengthTips.push(`CV un peu court (${wordCount} mots). Visez 300–700 mots.`); }
  else if (wordCount >  700 && wordCount <= 900) { lengthScore = 10; lengthTips.push(`CV légèrement long (${wordCount} mots). Idéal : 300–700 mots.`); }
  else if (wordCount <  250)                     { lengthScore = 4;  lengthTips.push(`CV trop court (${wordCount} mots). Détaillez vos expériences.`); }
  else                                           { lengthScore = 5;  lengthTips.push(`CV trop long (${wordCount} mots). Les ATS préfèrent la concision.`); }
  categories.push({ name: "Longueur du contenu", icon: "📏", score: lengthScore, max: 15, tips: lengthTips });

  // 4. Verbes d'action (15 pts)
  const verbCount = ACTION_VERBS.filter(v => lower.includes(v)).length;
  const verbScore = verbCount >= 6 ? 15 : verbCount >= 4 ? 10 : verbCount >= 2 ? 6 : verbCount >= 1 ? 3 : 0;
  const verbTips: string[] = [];
  if (verbCount === 0) verbTips.push("Aucun verbe d'action détecté. Commencez vos lignes par : géré, développé, créé, optimisé…");
  else if (verbCount < 4) verbTips.push(`Seulement ${verbCount} verbe(s) d'action. Enrichissez : lancé, coordonné, piloté, amélioré…`);
  categories.push({ name: "Verbes d'action", icon: "💪", score: verbScore, max: 15, tips: verbTips });

  // 5. Compatibilité ATS (15 pts)
  const hasSpecialChars = /[|▪▸►◄◆◇★☆✓✗✔✘⚡🔥💼🎓]/.test(text);
  const hasTableHints   = /\t{2,}|\|[\s\-]+\|/.test(text);
  const hasDates        = /\d{4}|\b(jan|fév|mar|avr|mai|jun|jul|aoû|sep|oct|nov|déc|janvier|février|mars|avril|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i.test(text);
  const hasNumbers      = /\d+\s*(%|clients|projets|personnes|collaborateurs|k€|k dh|k mad|mad|dh)/i.test(text);
  const atsScore = (!hasSpecialChars ? 5 : 0) + (!hasTableHints ? 5 : 0) + (hasDates ? 3 : 0) + (hasNumbers ? 2 : 0);
  const atsTips: string[] = [];
  if (hasSpecialChars) atsTips.push("Évitez les emojis et symboles spéciaux — ils bloquent les parseurs ATS");
  if (hasTableHints)   atsTips.push("Les tableaux ne sont pas lus par les ATS. Utilisez du texte simple.");
  if (!hasDates)       atsTips.push("Ajoutez des dates à chaque expérience (ex: Jan 2022 – Déc 2023)");
  if (!hasNumbers)     atsTips.push("Quantifiez vos résultats (ex: +20% de CA, 5 projets livrés, 8 collaborateurs)");
  categories.push({ name: "Compatibilité ATS", icon: "🤖", score: atsScore, max: 15, tips: atsTips });

  // 6. Mots-clés (15 pts)
  const foundKeywords = COMMON_KW.filter(k => lower.includes(k));
  const kwCount = foundKeywords.length;
  const kwScore = kwCount >= 8 ? 15 : kwCount >= 5 ? 10 : kwCount >= 3 ? 6 : kwCount >= 1 ? 3 : 0;
  const kwTips: string[] = [];
  if (kwCount < 5) kwTips.push("Ajoutez des mots-clés de votre secteur : outils, logiciels, compétences spécifiques");
  kwTips.push("Adaptez vos mots-clés à chaque offre pour maximiser la compatibilité");
  categories.push({ name: "Mots-clés métier", icon: "🔍", score: kwScore, max: 15, tips: kwTips });

  const total    = categories.reduce((s, c) => s + c.score, 0);
  const maxTotal = categories.reduce((s, c) => s + c.max, 0);
  return { total, maxTotal, wordCount, categories, foundKeywords };
}

// ── Score helpers ──────────────────────────────────────────────────────────────

function scoreColor(pct: number) {
  if (pct >= 75) return { text: "text-emerald-600", bg: "bg-emerald-500", light: "bg-emerald-50 border-emerald-200", label: "Excellent", ring: "#10b981" };
  if (pct >= 55) return { text: "text-blue-600",    bg: "bg-blue-500",    light: "bg-blue-50 border-blue-200",       label: "Bon",       ring: "#3b82f6" };
  if (pct >= 35) return { text: "text-amber-600",   bg: "bg-amber-500",   light: "bg-amber-50 border-amber-200",     label: "Moyen",     ring: "#f59e0b" };
  return                { text: "text-red-600",      bg: "bg-red-500",     light: "bg-red-50 border-red-200",         label: "Faible",    ring: "#ef4444" };
}

function CircleScore({ pct, color, total, max }: { pct: number; color: ReturnType<typeof scoreColor>; total: number; max: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={color.ring} strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="70" y="65" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color.ring}>{total}</text>
        <text x="70" y="82" textAnchor="middle" fontSize="12" fill="#9ca3af">/ {max}</text>
      </svg>
      <span className={`text-sm font-bold px-3 py-1 rounded-full border ${color.light} ${color.text}`}>{color.label}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function CVCheckerPage() {
  const [text, setText]         = useState("");
  const [result, setResult]     = useState<Analysis | null>(null);
  const [loading, setLoading]   = useState(false);
  const fileRef                 = useRef<HTMLInputElement>(null);
  const resultRef               = useRef<HTMLDivElement>(null);

  const wordCount = text.trim() ? text.split(/\s+/).filter(Boolean).length : 0;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target?.result as string ?? "");
    reader.readAsText(file, "utf-8");
  }

  function handleAnalyze() {
    if (!text.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setResult(analyzeCV(text));
      setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }, 900);
  }

  const pct   = result ? Math.round((result.total / result.maxTotal) * 100) : 0;
  const color = scoreColor(pct);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary-dark text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            Outil gratuit
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-tight">
            Testez votre CV contre les filtres ATS
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto">
            80% des CV sont éliminés automatiquement avant d'être lus par un recruteur.
            Vérifiez votre score en 30 secondes — gratuitement, sans inscription.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Input card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Collez votre CV ici</h2>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm text-primary font-semibold hover:text-primary-dark transition-colors border border-primary/30 rounded-lg px-3 py-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importer .txt
            </button>
            <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleFile} />
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Copiez-collez le contenu texte de votre CV ici...

Exemple :
Mohammed Alaoui
Développeur Full Stack | Casablanca
m.alaoui@email.com | +212 6XX XXX XXX | linkedin.com/in/malaoui

Profil
Développeur passionné avec 3 ans d'expérience...

Expérience professionnelle
Développeur React — Entreprise XYZ (Jan 2022 – Présent)
• Développé et maintenu 5 applications web React
..."
            rows={14}
            className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-700 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />

          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">
              {wordCount > 0 ? (
                <span className={wordCount >= 300 && wordCount <= 700 ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                  {wordCount} mots
                </span>
              ) : (
                "Idéal : 300–700 mots"
              )}
              {" "}· Votre CV reste sur votre appareil, rien n'est envoyé
            </p>
            <button
              onClick={handleAnalyze}
              disabled={!text.trim() || loading}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Analyse en cours…
                </>
              ) : "Analyser mon CV →"}
            </button>
          </div>
        </div>

        {/* What is ATS */}
        {!result && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: "🤖", title: "Qu'est-ce qu'un ATS ?", desc: "Un Applicant Tracking System filtre automatiquement les CV avant qu'un humain ne les voie. 75% des grandes entreprises marocaines en utilisent un." },
              { icon: "📊", title: "Comment ça marche ?", desc: "Notre outil analyse votre CV selon 6 critères : structure, mots-clés, longueur, verbes d'action, formatage et informations de contact." },
              { icon: "🎯", title: "Que faire ensuite ?", desc: "Suivez les conseils personnalisés pour améliorer votre score, puis consultez nos offres d'emploi filtrées par secteur et ville." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultRef} className="space-y-6">
            {/* Score summary */}
            <div className={`bg-white rounded-2xl border-2 shadow-sm p-6 ${color.light}`}>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <CircleScore pct={pct} color={color} total={result.total} max={result.maxTotal} />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                    Score ATS : {pct}% — {color.label}
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    {result.wordCount} mots analysés ·{" "}
                    {pct >= 75
                      ? "Votre CV est bien optimisé. Quelques ajustements peuvent encore l'améliorer."
                      : pct >= 55
                      ? "Votre CV est dans la moyenne. Suivez les conseils ci-dessous pour dépasser les filtres."
                      : pct >= 35
                      ? "Votre CV a besoin d'améliorations importantes pour passer les filtres ATS."
                      : "Votre CV risque d'être éliminé automatiquement. Appliquez les corrections urgentes."}
                  </p>
                  {result.foundKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.foundKeywords.slice(0, 8).map(kw => (
                        <span key={kw} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          {kw}
                        </span>
                      ))}
                      {result.foundKeywords.length > 8 && (
                        <span className="text-xs text-gray-400">+{result.foundKeywords.length - 8} autres</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {result.categories.map((cat) => {
                const catPct = Math.round((cat.score / cat.max) * 100);
                const cc = scoreColor(catPct);
                return (
                  <div key={cat.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="text-sm font-bold text-gray-900">{cat.name}</span>
                      </div>
                      <span className={`text-sm font-bold ${cc.text}`}>{cat.score}/{cat.max}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ${cc.bg}`}
                        style={{ width: `${catPct}%` }}
                      />
                    </div>
                    {cat.tips.length > 0 && (
                      <ul className="space-y-1">
                        {cat.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                            <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    )}
                    {cat.tips.length === 0 && (
                      <p className="text-xs text-emerald-600 font-semibold">✓ Bien optimisé</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white text-center">
              <h3 className="text-lg font-extrabold mb-2">Votre CV est prêt ? Trouvez votre prochain emploi</h3>
              <p className="text-white/80 text-sm mb-5">
                Consultez les offres CDI, CDD et Stage au Maroc — filtrées par secteur et ville.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/offres"
                  className="bg-white text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Voir les offres d'emploi →
                </Link>
                <button
                  onClick={() => { setResult(null); setText(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="bg-white/20 text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-white/30 transition-colors"
                >
                  Tester un autre CV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
