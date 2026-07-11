"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { trackToolEvent } from "@/lib/trackToolEvent";
import { useFunnelAbandonment } from "@/hooks/useFunnelAbandonment";

const NAVY = "#00347A";
const TURQ = "#00C2CB";
const TRACK = "#D0E4F0";

type Color = "R" | "B" | "V" | "J";

const COLORS: Record<Color, { name: string; hex: string; trait: string; mgmt: string; jobs: string[]; desc: string }> = {
  R: {
    name: "Rouge",
    hex: "#E74C3C",
    trait: "Dominant",
    mgmt: "Direct et orienté résultats : vous décidez vite et menez les équipes vers l'objectif.",
    jobs: ["Directeur", "Entrepreneur", "Commercial senior", "Chef de projet", "Manager"],
    desc: "Énergique, décisif et compétitif. Vous aimez relever des défis et prendre les commandes.",
  },
  B: {
    name: "Bleu",
    hex: "#3498DB",
    trait: "Analytique",
    mgmt: "Rigoureux et méthodique : vous valorisez la précision, les données et la qualité.",
    jobs: ["Analyste", "Comptable", "Ingénieur", "Auditeur", "Chercheur"],
    desc: "Réfléchi, précis et organisé. Vous appréciez les faits, la logique et le travail bien fait.",
  },
  V: {
    name: "Vert",
    hex: "#2ECC71",
    trait: "Stable",
    mgmt: "Bienveillant et patient : vous créez un climat de confiance et privilégiez l'harmonie.",
    jobs: ["RH", "Infirmier", "Conseiller", "Enseignant", "Travailleur social"],
    desc: "Calme, fiable et coopératif. Vous favorisez l'entraide et les relations durables.",
  },
  J: {
    name: "Jaune",
    hex: "#F1C40F",
    trait: "Influent",
    mgmt: "Inspirant et sociable : vous motivez par l'enthousiasme et la communication.",
    jobs: ["Communicant", "Animateur", "Formateur", "Marketing", "Événementiel"],
    desc: "Sociable, enthousiaste et créatif. Vous aimez convaincre, fédérer et innover.",
  },
};

// 28 questions: each option assigns a color
type Q = { text: string; opts: { label: string; c: Color }[] };

const QUESTIONS: Q[] = [
  { text: "Au travail, je préfère…", opts: [
    { label: "Prendre les décisions", c: "R" },
    { label: "Analyser les données", c: "B" },
    { label: "Aider mes collègues", c: "V" },
    { label: "Motiver l'équipe", c: "J" },
  ]},
  { text: "On me décrit comme…", opts: [
    { label: "Déterminé", c: "R" },
    { label: "Précis", c: "B" },
    { label: "Patient", c: "V" },
    { label: "Sociable", c: "J" },
  ]},
  { text: "Face à un problème, je…", opts: [
    { label: "Agis immédiatement", c: "R" },
    { label: "Étudie tous les détails", c: "B" },
    { label: "Cherche un consensus", c: "V" },
    { label: "Brainstorme des idées", c: "J" },
  ]},
  { text: "Mon rythme préféré est…", opts: [
    { label: "Rapide et intense", c: "R" },
    { label: "Méthodique", c: "B" },
    { label: "Calme et régulier", c: "V" },
    { label: "Varié et dynamique", c: "J" },
  ]},
  { text: "En réunion, je…", opts: [
    { label: "Mène les débats", c: "R" },
    { label: "Apporte des faits", c: "B" },
    { label: "Écoute attentivement", c: "V" },
    { label: "Anime l'ambiance", c: "J" },
  ]},
  { text: "Ce qui me motive le plus…", opts: [
    { label: "Les résultats", c: "R" },
    { label: "La qualité", c: "B" },
    { label: "La stabilité", c: "V" },
    { label: "La reconnaissance", c: "J" },
  ]},
  { text: "Mon bureau est…", opts: [
    { label: "Fonctionnel", c: "R" },
    { label: "Très ordonné", c: "B" },
    { label: "Accueillant", c: "V" },
    { label: "Coloré et vivant", c: "J" },
  ]},
  { text: "Je gère le stress en…", opts: [
    { label: "Passant à l'action", c: "R" },
    { label: "Planifiant", c: "B" },
    { label: "Prenant du recul", c: "V" },
    { label: "En parlant aux autres", c: "J" },
  ]},
  { text: "Un bon manager doit être…", opts: [
    { label: "Décisif", c: "R" },
    { label: "Rigoureux", c: "B" },
    { label: "À l'écoute", c: "V" },
    { label: "Inspirant", c: "J" },
  ]},
  { text: "Je préfère les projets…", opts: [
    { label: "Ambitieux", c: "R" },
    { label: "Bien cadrés", c: "B" },
    { label: "Collaboratifs", c: "V" },
    { label: "Créatifs", c: "J" },
  ]},
  { text: "Mon point fort…", opts: [
    { label: "Le leadership", c: "R" },
    { label: "La rigueur", c: "B" },
    { label: "La loyauté", c: "V" },
    { label: "L'enthousiasme", c: "J" },
  ]},
  { text: "Face au changement…", opts: [
    { label: "Je fonce", c: "R" },
    { label: "J'analyse les risques", c: "B" },
    { label: "Je m'adapte doucement", c: "V" },
    { label: "Je m'enthousiasme", c: "J" },
  ]},
  { text: "Je communique de façon…", opts: [
    { label: "Directe", c: "R" },
    { label: "Factuelle", c: "B" },
    { label: "Posée", c: "V" },
    { label: "Expressive", c: "J" },
  ]},
  { text: "Le travail idéal me laisse…", opts: [
    { label: "Du pouvoir d'action", c: "R" },
    { label: "De la précision", c: "B" },
    { label: "De la sérénité", c: "V" },
    { label: "Du contact humain", c: "J" },
  ]},
  { text: "Mes amis me sollicitent pour…", opts: [
    { label: "Trancher", c: "R" },
    { label: "Un avis réfléchi", c: "B" },
    { label: "Du réconfort", c: "V" },
    { label: "M'amuser", c: "J" },
  ]},
  { text: "Une bonne décision est…", opts: [
    { label: "Rapide", c: "R" },
    { label: "Fondée sur les faits", c: "B" },
    { label: "Acceptée par tous", c: "V" },
    { label: "Audacieuse", c: "J" },
  ]},
  { text: "J'apprends mieux en…", opts: [
    { label: "Faisant", c: "R" },
    { label: "Étudiant", c: "B" },
    { label: "Observant", c: "V" },
    { label: "Échangeant", c: "J" },
  ]},
  { text: "Mon défaut assumé…", opts: [
    { label: "Impatient", c: "R" },
    { label: "Trop perfectionniste", c: "B" },
    { label: "Trop conciliant", c: "V" },
    { label: "Dispersé", c: "J" },
  ]},
  { text: "En équipe, j'apporte…", opts: [
    { label: "L'énergie", c: "R" },
    { label: "La méthode", c: "B" },
    { label: "La cohésion", c: "V" },
    { label: "La créativité", c: "J" },
  ]},
  { text: "Je préfère un feedback…", opts: [
    { label: "Bref et direct", c: "R" },
    { label: "Détaillé et chiffré", c: "B" },
    { label: "Bienveillant", c: "V" },
    { label: "Encourageant", c: "J" },
  ]},
  { text: "Mon idéal de carrière…", opts: [
    { label: "Diriger", c: "R" },
    { label: "Expertise", c: "B" },
    { label: "Équilibre de vie", c: "V" },
    { label: "Notoriété", c: "J" },
  ]},
  { text: "Quand je négocie…", opts: [
    { label: "Je vise à gagner", c: "R" },
    { label: "Je prépare mes arguments", c: "B" },
    { label: "Je cherche l'accord", c: "V" },
    { label: "Je crée du lien", c: "J" },
  ]},
  { text: "Le week-end, je…", opts: [
    { label: "Fais du sport intense", c: "R" },
    { label: "Range et planifie", c: "B" },
    { label: "Me repose en famille", c: "V" },
    { label: "Vois plein de monde", c: "J" },
  ]},
  { text: "Mon style vestimentaire…", opts: [
    { label: "Affirmé", c: "R" },
    { label: "Sobre", c: "B" },
    { label: "Confortable", c: "V" },
    { label: "Original", c: "J" },
  ]},
  { text: "Je supporte mal…", opts: [
    { label: "La lenteur", c: "R" },
    { label: "L'imprécision", c: "B" },
    { label: "Les conflits", c: "V" },
    { label: "La routine", c: "J" },
  ]},
  { text: "Pour convaincre, j'utilise…", opts: [
    { label: "Ma volonté", c: "R" },
    { label: "Des preuves", c: "B" },
    { label: "La patience", c: "V" },
    { label: "Mon charisme", c: "J" },
  ]},
  { text: "Mon objectif premier…", opts: [
    { label: "Performer", c: "R" },
    { label: "Bien faire", c: "B" },
    { label: "Être en paix", c: "V" },
    { label: "Inspirer", c: "J" },
  ]},
  { text: "On compte sur moi pour…", opts: [
    { label: "Décider", c: "R" },
    { label: "Vérifier", c: "B" },
    { label: "Soutenir", c: "V" },
    { label: "Dynamiser", c: "J" },
  ]},
];

export default function CouleursClient() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Color[]>([]);
  const [done, setDone] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const startedRef = useRef(false);

  const total = QUESTIONS.length;

  const counts = useMemo(() => {
    const c: Record<Color, number> = { R: 0, B: 0, V: 0, J: 0 };
    answers.forEach((a) => { if (a) c[a]++; });
    return c;
  }, [answers]);

  const dominant = (Object.keys(counts) as Color[]).sort((a, b) => counts[b] - counts[a])[0];

  useEffect(() => {
    trackToolEvent("personality_test", "page_view", { testType: "couleurs" });
  }, []);

  useFunnelAbandonment(
    "personality_test",
    "test_abandoned",
    () => (done ? null : { pct_completed: Math.round((current / total) * 100) }),
    { testType: "couleurs" }
  );

  useEffect(() => {
    if (done) trackToolEvent("personality_test", "result_viewed", { testType: "couleurs", metadata: { result_type: dominant } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function choose(color: Color) {
    if (transitioning) return;
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("personality_test", "test_started", { testType: "couleurs" });
    }
    trackToolEvent("personality_test", "question_answered", { testType: "couleurs", metadata: { question_index: current, total } });
    const next = [...answers];
    next[current] = color;
    setAnswers(next);
    setTransitioning(true);
    setTimeout(() => {
      if (current + 1 >= total) {
        setDone(true);
        trackToolEvent("personality_test", "test_completed", { testType: "couleurs" });
      } else setCurrent((c) => c + 1);
      setTransitioning(false);
    }, 300);
  }

  if (done) {
    const answered = answers.filter(Boolean).length || 1;
    const order = (Object.keys(counts) as Color[]).sort((a, b) => counts[b] - counts[a]);
    const info = COLORS[dominant];

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: info.hex }}>
            <div className="p-6 text-white text-center" style={{ background: info.hex }}>
              <p className="text-sm uppercase tracking-wide opacity-90">Votre couleur dominante</p>
              <h1 className="mt-1 text-3xl font-extrabold">{info.name} · {info.trait}</h1>
            </div>
            <div className="bg-white p-6">
              <p className="text-gray-700 mb-6">{info.desc}</p>

              {/* CSS bar chart */}
              <h2 className="font-bold mb-3" style={{ color: NAVY }}>Votre répartition</h2>
              <div className="space-y-3 mb-6">
                {order.map((c) => {
                  const pct = Math.round((counts[c] / answered) * 100);
                  return (
                    <div key={c}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{COLORS[c].name}</span>
                        <span className="text-gray-500">{pct}%</span>
                      </div>
                      <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-4 rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[c].hex }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <h2 className="font-bold mb-2" style={{ color: NAVY }}>Style de management</h2>
              <p className="text-sm text-gray-700 mb-5">{info.mgmt}</p>

              <h2 className="font-bold mb-2" style={{ color: NAVY }}>Métiers recommandés</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {info.jobs.map((j) => (
                  <span key={j} className="rounded-full px-3 py-1 text-xs font-medium text-white" style={{ background: info.hex }}>{j}</span>
                ))}
              </div>

              <Link
                href="/offres"
                onClick={() => trackToolEvent("personality_test", "job_match_clicked", { testType: "couleurs", metadata: { result_type: dominant } })}
                className="block text-center rounded-xl px-5 py-3 font-semibold text-white"
                style={{ background: NAVY }}
              >
                Voir les offres compatibles →
              </Link>
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
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Test des Couleurs</h1>
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
                onClick={() => choose(o.c)}
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
