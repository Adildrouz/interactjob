"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MBTI_QUESTIONS, MBTI_TYPES, type AxisScores } from "./mbtiData";
import { trackToolEvent } from "@/lib/trackToolEvent";
import { useFunnelAbandonment } from "@/hooks/useFunnelAbandonment";

const NAVY = "#00347A";
const TURQ = "#00C2CB";
const TRACK = "#D0E4F0";

type Answer = "a" | "b";

function computeType(answers: Answer[]): { code: string; scores: AxisScores } {
  const scores: AxisScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  MBTI_QUESTIONS.forEach((q, i) => {
    const pick = answers[i];
    if (!pick) return;
    if (q.axis === "EI") pick === "a" ? scores.E++ : scores.I++;
    if (q.axis === "SN") pick === "a" ? scores.S++ : scores.N++;
    if (q.axis === "TF") pick === "a" ? scores.T++ : scores.F++;
    if (q.axis === "JP") pick === "a" ? scores.J++ : scores.P++;
  });
  const code =
    (scores.E >= scores.I ? "E" : "I") +
    (scores.S >= scores.N ? "S" : "N") +
    (scores.T >= scores.F ? "T" : "F") +
    (scores.J >= scores.P ? "J" : "P");
  return { code, scores };
}

export default function MBTIClient() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [done, setDone] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const startedRef = useRef(false);

  const total = MBTI_QUESTIONS.length;
  const result = useMemo(() => (done ? computeType(answers) : null), [done, answers]);

  useEffect(() => {
    trackToolEvent("personality_test", "page_view", { testType: "mbti" });
  }, []);

  useFunnelAbandonment(
    "personality_test",
    "test_abandoned",
    () => (done ? null : { pct_completed: Math.round((current / total) * 100) }),
    { testType: "mbti" }
  );

  function choose(pick: Answer) {
    if (transitioning) return;
    if (!startedRef.current) {
      startedRef.current = true;
      trackToolEvent("personality_test", "test_started", { testType: "mbti" });
    }
    trackToolEvent("personality_test", "question_answered", { testType: "mbti", metadata: { question_index: current, total } });
    const next = [...answers];
    next[current] = pick;
    setAnswers(next);
    setTransitioning(true);
    setTimeout(() => {
      if (current + 1 >= total) {
        setDone(true);
        trackToolEvent("personality_test", "test_completed", { testType: "mbti" });
      } else {
        setCurrent((c) => c + 1);
      }
      setTransitioning(false);
    }, 300);
  }

  if (done && result) {
    return <MBTIResult code={result.code} scores={result.scores} />;
  }

  const q = MBTI_QUESTIONS[current];
  const progress = Math.round((current / total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>Test MBTI</h1>
          <p className="text-sm text-gray-500">Question {current + 1} / {total}</p>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full mb-8" style={{ background: TRACK }}>
          <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: TURQ }} />
        </div>

        {/* Question */}
        <div className={`rounded-2xl bg-white p-6 transition-opacity duration-200 ${transitioning ? "opacity-40" : "opacity-100"}`} style={{ border: `2px solid ${TRACK}` }}>
          <p className="text-lg font-semibold text-gray-900 mb-5 text-center">{q.text}</p>
          <div className="grid gap-3">
            {(["a", "b"] as const).map((opt) => {
              const selected = answers[current] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => choose(opt)}
                  className="min-h-[44px] w-full rounded-xl px-4 py-3 text-left text-gray-800 font-medium transition-all hover:border-[color:var(--turq)]"
                  style={{
                    border: `2px solid ${selected ? NAVY : "#E2E8F0"}`,
                    background: selected ? "#F0F7FF" : "white",
                    // @ts-expect-error custom prop
                    "--turq": TURQ,
                  }}
                >
                  {opt === "a" ? q.a : q.b}
                </button>
              );
            })}
          </div>
        </div>

        {current > 0 && (
          <button onClick={() => setCurrent((c) => c - 1)} className="mt-5 text-sm text-gray-500 hover:underline">
            ← Question précédente
          </button>
        )}
      </div>
    </div>
  );
}

function MBTIResult({ code, scores }: { code: string; scores: AxisScores }) {
  const type = MBTI_TYPES[code];
  const [tab, setTab] = useState<"desc" | "sw" | "car" | "cel">("desc");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    trackToolEvent("personality_test", "result_viewed", { testType: "mbti", metadata: { result_type: code } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!type) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Résultat indisponible. Veuillez refaire le test.</p>
        <Link href="/test-personnalite/mbti" className="mt-4 inline-block font-semibold" style={{ color: TURQ }}>
          Refaire le test →
        </Link>
      </div>
    );
  }

  function share() {
    const id = `mbti_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    const payload = {
      id,
      test_type: "mbti",
      result_type: code,
      scores,
      created_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem(id, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    const url = `${window.location.origin}/test-personnalite/resultat/${id}`;
    setShareUrl(url);
    trackToolEvent("personality_test", "result_shared", { testType: "mbti", metadata: { result_type: code } });
    if (navigator.share) {
      navigator.share({ title: `Mon profil MBTI ${code}`, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  }

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "desc", label: "Description" },
    { key: "sw", label: "Forces & Faiblesses" },
    { key: "car", label: "Carrières" },
    { key: "cel", label: "Célébrités" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Type card */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${type.color}` }}>
          <div className="p-6 text-white text-center" style={{ background: NAVY }}>
            <div className="text-4xl font-extrabold tracking-wider" style={{ color: TURQ }}>{code}</div>
            <h1 className="mt-1 text-2xl font-bold">{type.name}</h1>
            <p className="mt-1 text-white/80 text-sm">{type.tagline}</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b bg-white overflow-x-auto">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className="flex-1 whitespace-nowrap px-3 py-3 text-xs sm:text-sm font-semibold transition-colors"
                style={{
                  color: tab === tb.key ? NAVY : "#94A3B8",
                  borderBottom: tab === tb.key ? `3px solid ${TURQ}` : "3px solid transparent",
                }}
              >
                {tb.label}
              </button>
            ))}
          </div>

          <div className="bg-white p-6 text-sm text-gray-700">
            {tab === "desc" && (
              <div className="space-y-3">
                {type.description.map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
            {tab === "sw" && (
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <h3 className="font-bold mb-2" style={{ color: NAVY }}>Forces</h3>
                  <ul className="space-y-1">
                    {type.strengths.map((s) => <li key={s}>✅ {s}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2" style={{ color: NAVY }}>Faiblesses</h3>
                  <ul className="space-y-1">
                    {type.weaknesses.map((w) => <li key={w}>⚠️ {w}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {tab === "car" && (
              <div>
                <h3 className="font-bold mb-2" style={{ color: NAVY }}>Métiers recommandés</h3>
                <div className="flex flex-wrap gap-2">
                  {type.careers.map((c) => (
                    <span key={c} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "#F0F7FF", color: NAVY }}>{c}</span>
                  ))}
                </div>
              </div>
            )}
            {tab === "cel" && (
              <div>
                <h3 className="font-bold mb-2" style={{ color: NAVY }}>Personnalités célèbres</h3>
                <ul className="space-y-1">
                  {type.famous.map((f) => <li key={f}>⭐ {f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 grid gap-3">
          <button
            onClick={share}
            className="min-h-[44px] rounded-xl font-semibold text-white"
            style={{ background: TURQ }}
          >
            Partager mon profil MBTI
          </button>
          {shareUrl && (
            <p className="text-xs text-center text-gray-500 break-all">Lien copié : {shareUrl}</p>
          )}
          <Link
            href={`/offres?personality=${code}`}
            onClick={() => trackToolEvent("personality_test", "job_match_clicked", { testType: "mbti", metadata: { result_type: code } })}
            className="min-h-[44px] flex items-center justify-center rounded-xl font-semibold text-white"
            style={{ background: NAVY }}
          >
            Voir les offres compatibles →
          </Link>
        </div>
      </div>
    </div>
  );
}
