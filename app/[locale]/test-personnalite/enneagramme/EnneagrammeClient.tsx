"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { trackToolEvent } from "@/lib/trackToolEvent";
import { useFunnelAbandonment } from "@/hooks/useFunnelAbandonment";

const NAVY = "#00347A";
const TURQ = "#00C2CB";
const TRACK = "#D0E4F0";

type Type = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const TYPES: Record<Type, { name: string; desc: string; wings: string; growth: string }> = {
  1: { name: "Le Perfectionniste", desc: "Rationnel, idéaliste et organisé. Vous recherchez l'intégrité et l'amélioration.", wings: "Ailes 9 (sereine) et 2 (chaleureuse).", growth: "Apprenez à lâcher prise et à accepter l'imperfection." },
  2: { name: "L'Altruiste", desc: "Généreux, attentionné et empathique. Vous aimez aider les autres.", wings: "Ailes 1 (exigeante) et 3 (ambitieuse).", growth: "Prenez soin de vos propres besoins, pas seulement de ceux des autres." },
  3: { name: "Le Battant", desc: "Ambitieux, efficace et orienté succès. Vous visez l'accomplissement.", wings: "Ailes 2 (chaleureuse) et 4 (créative).", growth: "Cultivez l'authenticité au-delà de l'image de réussite." },
  4: { name: "L'Individualiste", desc: "Sensible, créatif et introspectif. Vous cherchez le sens et l'unicité.", wings: "Ailes 3 (dynamique) et 5 (analytique).", growth: "Ancrez-vous dans le présent plutôt que dans l'idéal." },
  5: { name: "L'Observateur", desc: "Curieux, analytique et indépendant. Vous valorisez la connaissance.", wings: "Ailes 4 (créative) et 6 (loyale).", growth: "Partagez vos idées et engagez-vous avec le monde." },
  6: { name: "Le Loyal", desc: "Fiable, prévoyant et engagé. Vous recherchez la sécurité et la confiance.", wings: "Ailes 5 (analytique) et 7 (enthousiaste).", growth: "Faites confiance à votre propre jugement." },
  7: { name: "L'Épicurien", desc: "Enthousiaste, spontané et optimiste. Vous aimez les nouvelles expériences.", wings: "Ailes 6 (prudente) et 8 (affirmée).", growth: "Allez au bout des projets et acceptez les moments difficiles." },
  8: { name: "Le Meneur", desc: "Confiant, déterminé et protecteur. Vous aimez contrôler votre destin.", wings: "Ailes 7 (dynamique) et 9 (apaisante).", growth: "Montrez votre vulnérabilité et écoutez les autres." },
  9: { name: "Le Médiateur", desc: "Accommodant, serein et bienveillant. Vous recherchez l'harmonie.", wings: "Ailes 8 (affirmée) et 1 (structurée).", growth: "Affirmez vos priorités et sortez de l'inertie." },
};

// 45 questions: 5 per type, each statement scores its type
const STATEMENTS: { t: Type; text: string }[] = [];
const SEEDS: Record<Type, string[]> = {
  1: ["Je veux bien faire les choses.", "Les erreurs me dérangent.", "J'ai un fort sens du devoir.", "Je remarque ce qui peut être amélioré.", "Je suis exigeant envers moi-même."],
  2: ["J'aime aider les autres.", "Je devine les besoins des gens.", "On vient facilement me confier ses soucis.", "Je me sens utile en soutenant les autres.", "Je donne beaucoup de mon temps aux autres."],
  3: ["Je vise la réussite.", "L'image que je renvoie compte.", "Je suis efficace et compétitif.", "J'aime atteindre mes objectifs.", "Je m'adapte pour réussir."],
  4: ["Je me sens différent des autres.", "Mes émotions sont intenses.", "J'apprécie la créativité et l'esthétique.", "Je cherche un sens profond.", "Je suis introspectif."],
  5: ["J'aime comprendre comment les choses fonctionnent.", "J'ai besoin de mon espace personnel.", "Je préfère observer avant d'agir.", "J'accumule des connaissances.", "Je suis indépendant."],
  6: ["Je cherche la sécurité.", "J'anticipe les problèmes possibles.", "La loyauté est essentielle pour moi.", "Je teste la fiabilité des gens.", "Je me prépare aux imprévus."],
  7: ["J'aime les nouvelles expériences.", "Je suis optimiste et enthousiaste.", "J'évite l'ennui et la routine.", "J'ai mille projets en tête.", "Je préfère voir le bon côté des choses."],
  8: ["J'aime être aux commandes.", "Je protège mes proches.", "Je dis ce que je pense franchement.", "Je n'aime pas qu'on me contrôle.", "Je fais face aux conflits."],
  9: ["Je recherche l'harmonie.", "J'évite les conflits.", "Je vois les différents points de vue.", "Je suis calme et accommodant.", "Je remets parfois les choses à plus tard."],
};
(Object.keys(SEEDS) as unknown as Type[]).forEach((tStr) => {
  const t = Number(tStr) as Type;
  SEEDS[t].forEach((text) => STATEMENTS.push({ t, text }));
});

const SCALE = [
  { label: "Pas du tout", v: 0 },
  { label: "Un peu", v: 1 },
  { label: "Moyennement", v: 2 },
  { label: "Beaucoup", v: 3 },
  { label: "Tout à fait", v: 4 },
];

// Enneagram wheel point coordinates (9 points around a circle)
function wheelPoints(cx: number, cy: number, r: number) {
  const pts: { n: Type; x: number; y: number }[] = [];
  for (let i = 0; i < 9; i++) {
    // Place type 9 at top, going clockwise 1..8
    const angle = (-90 + i * 40) * (Math.PI / 180);
    const n = (i === 0 ? 9 : i) as Type;
    pts.push({ n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return pts;
}

export default function EnneagrammeClient() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const total = STATEMENTS.length;
  const startedRef = useRef(false);

  const scores = useMemo(() => {
    const s: Record<Type, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    STATEMENTS.forEach((st, i) => { if (answers[i] != null) s[st.t] += answers[i]; });
    return s;
  }, [answers]);

  const winner = (Object.keys(scores) as unknown as Type[])
    .map((k) => Number(k) as Type)
    .sort((a, b) => scores[b] - scores[a])[0];

  useEffect(() => {
    trackToolEvent("personality_test", "page_view", { testType: "enneagramme" });
  }, []);

  useFunnelAbandonment(
    "personality_test",
    "test_abandoned",
    () => (done ? null : { pct_completed: Math.round((current / total) * 100) }),
    { testType: "enneagramme" }
  );

  useEffect(() => {
    if (done) trackToolEvent("personality_test", "result_viewed", { testType: "enneagramme", metadata: { result_type: winner } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function choose(v: number) {
    if (transitioning) return;
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("personality_test", "test_started", { testType: "enneagramme" });
    }
    trackToolEvent("personality_test", "question_answered", { testType: "enneagramme", metadata: { question_index: current, total } });
    const next = [...answers];
    next[current] = v;
    setAnswers(next);
    setTransitioning(true);
    setTimeout(() => {
      if (current + 1 >= total) {
        setDone(true);
        trackToolEvent("personality_test", "test_completed", { testType: "enneagramme" });
      } else setCurrent((c) => c + 1);
      setTransitioning(false);
    }, 300);
  }

  if (done) {
    const info = TYPES[winner];
    const pts = wheelPoints(150, 150, 110);

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: NAVY }}>
            <div className="p-6 text-white text-center" style={{ background: NAVY }}>
              <p className="text-sm uppercase tracking-wide" style={{ color: TURQ }}>Votre type</p>
              <h1 className="mt-1 text-3xl font-extrabold">Type {winner} · {info.name}</h1>
            </div>
            <div className="bg-white p-6">
              {/* SVG wheel */}
              <svg viewBox="0 0 300 300" className="mx-auto mb-6 w-64 h-64" role="img" aria-label="Roue de l'ennéagramme">
                <polygon
                  points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                  fill="none"
                  stroke={TRACK}
                  strokeWidth={2}
                />
                <circle cx={150} cy={150} r={110} fill="none" stroke={TRACK} strokeWidth={1.5} />
                {pts.map((p) => {
                  const active = p.n === winner;
                  return (
                    <g key={p.n}>
                      <circle cx={p.x} cy={p.y} r={active ? 22 : 16} fill={active ? TURQ : "white"} stroke={active ? NAVY : "#94A3B8"} strokeWidth={2} />
                      <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={active ? 18 : 14} fontWeight="bold" fill={active ? "white" : "#475569"}>{p.n}</text>
                    </g>
                  );
                })}
              </svg>

              <p className="text-gray-700 mb-5">{info.desc}</p>

              <h2 className="font-bold mb-1" style={{ color: NAVY }}>Vos ailes</h2>
              <p className="text-sm text-gray-700 mb-4">{info.wings}</p>

              <h2 className="font-bold mb-1" style={{ color: NAVY }}>Chemin de croissance</h2>
              <p className="text-sm text-gray-700 mb-6">{info.growth}</p>

              <Link
                href="/offres"
                onClick={() => trackToolEvent("personality_test", "job_match_clicked", { testType: "enneagramme", metadata: { result_type: winner } })}
                className="block text-center rounded-xl px-5 py-3 font-semibold text-white mb-5"
                style={{ background: TURQ }}
              >
                Voir les offres compatibles →
              </Link>

              <div className="border-t pt-4">
                <h2 className="font-bold mb-2" style={{ color: NAVY }}>Articles liés</h2>
                <ul className="space-y-1 text-sm">
                  <li><Link href="/blog" className="hover:underline" style={{ color: TURQ }}>→ Mieux se connaître pour mieux travailler</Link></li>
                  <li><Link href="/blog" className="hover:underline" style={{ color: TURQ }}>→ Développement personnel et carrière</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const st = STATEMENTS[current];
  const progress = Math.round((current / total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Test Ennéagramme</h1>
          <p className="text-sm text-gray-500">Question {current + 1} / {total}</p>
        </div>
        <div className="h-2 rounded-full mb-8" style={{ background: TRACK }}>
          <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: TURQ }} />
        </div>
        <div className={`rounded-2xl bg-white p-6 border-2 transition-opacity duration-200 ${transitioning ? "opacity-40" : ""}`} style={{ borderColor: TRACK }}>
          <p className="text-lg font-semibold text-gray-900 mb-5 text-center">« {st.text} »</p>
          <div className="grid gap-2">
            {SCALE.map((s) => (
              <button
                key={s.v}
                onClick={() => choose(s.v)}
                className="min-h-[44px] w-full rounded-xl px-4 py-3 text-left font-medium text-gray-800 border-2 border-gray-200 hover:border-gray-400 transition-colors"
              >
                {s.label}
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
