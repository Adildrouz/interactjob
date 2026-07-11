'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { questions as QUESTIONS } from '@/data/personality/questions';
import { ProgressBar } from '@/components/personality/assessment/ProgressBar';
import { QuestionCard } from '@/components/personality/assessment/QuestionCard';
import type { AssessmentAnswer } from '@/types/personality';
import { trackToolEvent } from '@/lib/trackToolEvent';
import { useFunnelAbandonment } from '@/hooks/useFunnelAbandonment';

type Stage = 'intro' | 'questions' | 'submitting' | 'error';

export default function AssessmentPage() {
  const router = useRouter();
  const sessionId = useRef(crypto.randomUUID());
  const [stage, setStage] = useState<Stage>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const total = QUESTIONS.length;
  const question = QUESTIONS[current];

  useEffect(() => {
    trackToolEvent('personality_test', 'page_view', { testType: 'professionnel' });
  }, []);

  useFunnelAbandonment(
    'personality_test',
    'test_abandoned',
    () => (stage === 'questions' ? { pct_completed: Math.round((current / total) * 100) } : null),
    { testType: 'professionnel' }
  );

  function handleAnswer(id: 'A' | 'B' | 'C' | 'D') {
    if (current === 0) trackToolEvent('personality_test', 'test_started', { testType: 'professionnel' });
    trackToolEvent('personality_test', 'question_answered', { testType: 'professionnel', metadata: { question_index: current, total } });

    const newAnswers: AssessmentAnswer[] = [
      ...answers,
      { questionId: question.id, selectedOption: id },
    ];
    setAnswers(newAnswers);

    if (current + 1 < total) {
      setCurrent(c => c + 1);
    } else {
      trackToolEvent('personality_test', 'test_completed', { testType: 'professionnel' });
      submit(newAnswers);
    }
  }

  async function submit(finalAnswers: AssessmentAnswer[]) {
    setStage('submitting');
    try {
      const res = await fetch('/api/personality/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers, sessionId: sessionId.current }),
      });
      const data = await res.json() as { success: boolean; data?: { assessmentId: string }; error?: string };
      if (!data.success || !data.data) {
        setErrorMsg(data.error ?? 'Une erreur est survenue');
        setStage('error');
        return;
      }
      router.push(`/personality/result/${data.data.assessmentId}`);
    } catch {
      setErrorMsg('Erreur réseau. Vérifiez votre connexion.');
      setStage('error');
    }
  }

  if (stage === 'intro') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center space-y-8">
          <div>
            <div className="text-6xl mb-6">🧠</div>
            <h1 className="text-3xl font-bold text-white mb-3">Test de Personnalité Professionnelle</h1>
            <p className="text-slate-400">
              40 situations de travail réelles. Choisissez la réponse qui vous ressemble le plus — il n'y a pas de bonne ou mauvaise réponse.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { icon: '⏱️', label: '10 minutes', sub: 'environ' },
              { icon: '🎯', label: '40 questions', sub: 'situationnelles' },
              { icon: '🔒', label: 'Anonyme', sub: 'par défaut' },
              { icon: '⚡', label: 'Résultat', sub: 'instantané' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-white font-medium text-sm">{item.label}</div>
                <div className="text-slate-500 text-xs">{item.sub}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setStage('questions')}
              className="w-full rounded-xl py-4 font-semibold text-lg text-white hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}
            >
              Commencer le test
            </button>
            <p className="text-xs text-slate-600">
              Aucun compte requis · Résultat gratuit immédiat · Rapport premium optionnel
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (stage === 'submitting') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Analyse en cours…</h2>
            <p className="text-slate-400 text-sm">Calcul de votre profil comportemental</p>
          </div>
        </div>
      </main>
    );
  }

  if (stage === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="text-5xl">⚠️</div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Une erreur est survenue</h2>
            <p className="text-slate-400 text-sm">{errorMsg}</p>
          </div>
          <button
            onClick={() => { setStage('intro'); setCurrent(0); setAnswers([]); setErrorMsg(''); }}
            className="w-full rounded-xl py-3 font-semibold text-white border border-slate-700 hover:border-slate-500 transition-colors"
          >
            Recommencer
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Question {current + 1} sur {total}</span>
            <span className="text-slate-500 text-sm">{Math.round((current / total) * 100)}% complété</span>
          </div>
          <ProgressBar current={current} total={total} />
        </div>

        <QuestionCard
          key={current}
          question={question}
          questionNumber={current + 1}
          total={total}
          onAnswer={handleAnswer}
        />

        {current > 0 && (
          <button
            onClick={() => {
              setCurrent(c => c - 1);
              setAnswers(a => a.slice(0, -1));
            }}
            className="mt-4 text-sm text-slate-500 hover:text-slate-400 transition-colors"
          >
            ← Question précédente
          </button>
        )}
      </div>
    </main>
  );
}
