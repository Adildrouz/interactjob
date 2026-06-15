"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PriceTag from "@/components/PriceTag";

const NAVY = "#00347A";
const TURQ = "#00C2CB";
const TRACK = "#D0E4F0";

type D = "D" | "I" | "S" | "C";

const PROFILES: Record<D, { name: string; hex: string; desc: string; appli: string; jobs: string[] }> = {
  D: { name: "Dominant", hex: "#E74C3C", desc: "Orienté résultats, direct et décidé. Vous aimez relever des défis et prendre les commandes.", appli: "Idéal pour les postes de direction et de pilotage où il faut décider vite et porter la responsabilité.", jobs: ["Directeur", "Entrepreneur", "Chef de projet"] },
  I: { name: "Influent", hex: "#F1C40F", desc: "Sociable, enthousiaste et persuasif. Vous fédérez et motivez par votre énergie.", appli: "Parfait pour les fonctions commerciales, marketing et de communication.", jobs: ["Commercial", "Communicant", "Formateur"] },
  S: { name: "Stable", hex: "#2ECC71", desc: "Patient, fiable et coopératif. Vous favorisez l'harmonie et la constance.", appli: "Adapté aux métiers du support, du soin et de la relation durable.", jobs: ["RH", "Support client", "Infirmier"] },
  C: { name: "Consciencieux", hex: "#3498DB", desc: "Rigoureux, précis et analytique. Vous valorisez la qualité et les faits.", appli: "Idéal pour les fonctions techniques, financières et de contrôle qualité.", jobs: ["Analyste", "Auditeur", "Ingénieur"] },
};

type Q = { text: string; opts: { label: string; d: D }[] };

const QUESTIONS: Q[] = [
  { text: "Je suis surtout…", opts: [{ label: "Décidé", d: "D" }, { label: "Enthousiaste", d: "I" }, { label: "Patient", d: "S" }, { label: "Précis", d: "C" }] },
  { text: "Au travail, je cherche…", opts: [{ label: "Le résultat", d: "D" }, { label: "La reconnaissance", d: "I" }, { label: "La sécurité", d: "S" }, { label: "La qualité", d: "C" }] },
  { text: "On me reproche d'être…", opts: [{ label: "Trop direct", d: "D" }, { label: "Trop bavard", d: "I" }, { label: "Trop conciliant", d: "S" }, { label: "Trop pointilleux", d: "C" }] },
  { text: "Je décide…", opts: [{ label: "Vite", d: "D" }, { label: "Avec intuition", d: "I" }, { label: "Après réflexion", d: "S" }, { label: "Avec des données", d: "C" }] },
  { text: "Mon rythme…", opts: [{ label: "Rapide", d: "D" }, { label: "Dynamique", d: "I" }, { label: "Régulier", d: "S" }, { label: "Méthodique", d: "C" }] },
  { text: "En groupe, je…", opts: [{ label: "Dirige", d: "D" }, { label: "Anime", d: "I" }, { label: "Soutiens", d: "S" }, { label: "Structure", d: "C" }] },
  { text: "Je gère le conflit en…", opts: [{ label: "Affrontant", d: "D" }, { label: "Discutant", d: "I" }, { label: "Apaisant", d: "S" }, { label: "Analysant", d: "C" }] },
  { text: "Ma priorité…", opts: [{ label: "Gagner", d: "D" }, { label: "Influencer", d: "I" }, { label: "Coopérer", d: "S" }, { label: "Bien faire", d: "C" }] },
  { text: "Face au risque…", opts: [{ label: "Je fonce", d: "D" }, { label: "J'optimise", d: "I" }, { label: "Je sécurise", d: "S" }, { label: "Je calcule", d: "C" }] },
  { text: "Mon point fort…", opts: [{ label: "L'audace", d: "D" }, { label: "Le relationnel", d: "I" }, { label: "La loyauté", d: "S" }, { label: "La rigueur", d: "C" }] },
  { text: "Je communique de façon…", opts: [{ label: "Affirmée", d: "D" }, { label: "Expressive", d: "I" }, { label: "Posée", d: "S" }, { label: "Factuelle", d: "C" }] },
  { text: "Mon environnement idéal…", opts: [{ label: "Compétitif", d: "D" }, { label: "Convivial", d: "I" }, { label: "Stable", d: "S" }, { label: "Organisé", d: "C" }] },
  { text: "Je préfère…", opts: [{ label: "Commander", d: "D" }, { label: "Persuader", d: "I" }, { label: "Aider", d: "S" }, { label: "Vérifier", d: "C" }] },
  { text: "Face au changement…", opts: [{ label: "Je l'impose", d: "D" }, { label: "Je l'enthousiasme", d: "I" }, { label: "Je m'adapte", d: "S" }, { label: "Je l'évalue", d: "C" }] },
  { text: "On me décrit comme…", opts: [{ label: "Ambitieux", d: "D" }, { label: "Charismatique", d: "I" }, { label: "Fidèle", d: "S" }, { label: "Logique", d: "C" }] },
  { text: "Mon défaut…", opts: [{ label: "Impatient", d: "D" }, { label: "Dispersé", d: "I" }, { label: "Trop prudent", d: "S" }, { label: "Perfectionniste", d: "C" }] },
  { text: "En réunion…", opts: [{ label: "Je tranche", d: "D" }, { label: "J'inspire", d: "I" }, { label: "J'écoute", d: "S" }, { label: "Je documente", d: "C" }] },
  { text: "Je motive par…", opts: [{ label: "L'objectif", d: "D" }, { label: "L'émotion", d: "I" }, { label: "Le soutien", d: "S" }, { label: "L'exemple", d: "C" }] },
  { text: "Ma façon d'apprendre…", opts: [{ label: "En faisant", d: "D" }, { label: "En échangeant", d: "I" }, { label: "En observant", d: "S" }, { label: "En étudiant", d: "C" }] },
  { text: "Mon feedback idéal…", opts: [{ label: "Bref", d: "D" }, { label: "Encourageant", d: "I" }, { label: "Bienveillant", d: "S" }, { label: "Détaillé", d: "C" }] },
  { text: "Je supporte mal…", opts: [{ label: "La lenteur", d: "D" }, { label: "La routine", d: "I" }, { label: "Le conflit", d: "S" }, { label: "L'imprécision", d: "C" }] },
  { text: "Mon objectif de carrière…", opts: [{ label: "Diriger", d: "D" }, { label: "Briller", d: "I" }, { label: "Stabilité", d: "S" }, { label: "Expertise", d: "C" }] },
  { text: "Pour convaincre…", opts: [{ label: "J'impose", d: "D" }, { label: "Je séduis", d: "I" }, { label: "Je rassure", d: "S" }, { label: "Je prouve", d: "C" }] },
  { text: "On compte sur moi pour…", opts: [{ label: "Décider", d: "D" }, { label: "Dynamiser", d: "I" }, { label: "Soutenir", d: "S" }, { label: "Contrôler", d: "C" }] },
];

export default function DISCClient() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<D[]>([]);
  const [done, setDone] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const total = QUESTIONS.length;

  const counts = useMemo(() => {
    const c: Record<D, number> = { D: 0, I: 0, S: 0, C: 0 };
    answers.forEach((a) => { if (a) c[a]++; });
    return c;
  }, [answers]);

  function choose(d: D) {
    if (transitioning) return;
    const next = [...answers];
    next[current] = d;
    setAnswers(next);
    setTransitioning(true);
    setTimeout(() => {
      if (current + 1 >= total) setDone(true);
      else setCurrent((c) => c + 1);
      setTransitioning(false);
    }, 300);
  }

  if (done) {
    const answered = answers.filter(Boolean).length || 1;
    const order = (Object.keys(counts) as D[]).sort((a, b) => counts[b] - counts[a]);
    const dominant = order[0];
    const info = PROFILES[dominant];

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: info.hex }}>
            <div className="p-6 text-white text-center" style={{ background: NAVY }}>
              <p className="text-sm uppercase tracking-wide" style={{ color: TURQ }}>Votre profil DISC</p>
              <h1 className="mt-1 text-3xl font-extrabold">{dominant} · {info.name}</h1>
            </div>
            <div className="bg-white p-6">
              <p className="text-gray-700 mb-6">{info.desc}</p>

              {/* CSS bar visualization */}
              <h2 className="font-bold mb-3" style={{ color: NAVY }}>Votre profil détaillé</h2>
              <div className="space-y-3 mb-6">
                {(["D", "I", "S", "C"] as D[]).map((d) => {
                  const pct = Math.round((counts[d] / answered) * 100);
                  return (
                    <div key={d} className="flex items-center gap-3">
                      <span className="w-28 text-sm font-medium" style={{ color: PROFILES[d].hex }}>{d} · {PROFILES[d].name}</span>
                      <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-4 rounded-full transition-all" style={{ width: `${pct}%`, background: PROFILES[d].hex }} />
                      </div>
                      <span className="w-10 text-right text-sm text-gray-500">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <h2 className="font-bold mb-2" style={{ color: NAVY }}>Applications professionnelles</h2>
              <p className="text-sm text-gray-700 mb-4">{info.appli}</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {info.jobs.map((j) => (
                  <span key={j} className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ background: info.hex }}>{j}</span>
                ))}
              </div>

              <Link href="/offres" className="block text-center rounded-xl px-5 py-3 font-semibold text-white mb-3" style={{ background: TURQ }}>
                Voir les offres compatibles →
              </Link>

              {/* B2B CTA */}
              <a
                href="mailto:contact@interactjob.ma?subject=Pack%20entreprise%20DISC"
                className="block text-center rounded-xl px-5 py-3 font-semibold text-white"
                style={{ background: NAVY }}
              >
                Évaluer mon équipe avec DISC — Pack entreprise <PriceTag type="pack" />
              </a>
            </div>
          </div>
          <p className="mt-5 text-center text-sm">
            <Link href="/test-personnalite" className="hover:underline" style={{ color: NAVY }}>Passer un autre test</Link>
          </p>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[current];
  const progress = Math.round((current / total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Test DISC</h1>
          <p className="text-sm text-gray-500">Question {current + 1} / {total}</p>
        </div>
        <div className="h-2 rounded-full mb-8" style={{ background: TRACK }}>
          <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: TURQ }} />
        </div>
        <div className={`rounded-2xl bg-white p-6 border-2 transition-opacity duration-200 ${transitioning ? "opacity-40" : ""}`} style={{ borderColor: TRACK }}>
          <p className="text-lg font-semibold text-gray-900 mb-5 text-center">{q.text}</p>
          <div className="grid gap-3">
            {q.opts.map((o) => (
              <button
                key={o.label}
                onClick={() => choose(o.d)}
                className="min-h-[44px] w-full rounded-xl px-4 py-3 text-left font-medium text-gray-800 border-2 border-gray-200 hover:border-gray-400 transition-colors"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        {current > 0 && (
          <button onClick={() => setCurrent((c) => c - 1)} className="mt-5 text-sm text-gray-500 hover:underline">← Question précédente</button>
        )}
      </div>
    </div>
  );
}
