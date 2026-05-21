'use client';

import { useEffect, useState, use } from 'react';
import { FreeResult } from '@/components/personality/results/FreeResult';
import { PremiumReport } from '@/components/personality/results/PremiumReport';
import { PayPalButton } from '@/components/personality/payment/PayPalButton';
import type { PersonalityResult, PremiumReport as PR } from '@/types/personality';

type Stage = 'loading' | 'free' | 'payment' | 'generating' | 'premium' | 'error';

interface AssessmentData {
  assessmentId: string;
  result: PersonalityResult;
  isPremium: boolean;
  premiumReport?: PR;
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [stage, setStage] = useState<Stage>('loading');
  const [data, setData] = useState<AssessmentData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchResult() {
    try {
      const res = await fetch(`/api/personality/report/generate?assessmentId=${id}`);
      const json = await res.json() as { success: boolean; data?: AssessmentData; error?: string };
      if (!json.success || !json.data) {
        setErrorMsg(json.error ?? 'Résultat introuvable');
        setStage('error');
        return;
      }
      setData(json.data);
      if (json.data.isPremium && json.data.premiumReport) {
        setStage('premium');
      } else {
        setStage('free');
      }
    } catch {
      setErrorMsg('Erreur réseau');
      setStage('error');
    }
  }

  async function generateReport() {
    if (!data) return;
    setStage('generating');
    try {
      const res = await fetch('/api/personality/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: id }),
      });
      const json = await res.json() as { success: boolean; data?: { premiumReport: PR }; error?: string };
      if (!json.success || !json.data) {
        setErrorMsg(json.error ?? 'Génération échouée');
        setStage('error');
        return;
      }
      setData(d => d ? { ...d, isPremium: true, premiumReport: json.data!.premiumReport } : d);
      setStage('premium');
    } catch {
      setErrorMsg('Erreur lors de la génération du rapport');
      setStage('error');
    }
  }

  if (stage === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-400 text-sm">Chargement de votre résultat…</p>
        </div>
      </main>
    );
  }

  if (stage === 'generating') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-sm">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Génération de votre rapport…</h2>
            <p className="text-slate-400 text-sm">
              Claude AI analyse votre profil sur 18 dimensions. Cela prend environ 30 secondes.
            </p>
          </div>
          <div className="flex justify-center gap-1.5">
            {['Leadership', 'Communication', 'Carrière', 'Coaching'].map((label, i) => (
              <span key={label} className="text-xs text-slate-600 animate-pulse" style={{ animationDelay: `${i * 0.4}s` }}>
                {label}…
              </span>
            ))}
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
          <a href="/personality/assessment" className="block w-full rounded-xl py-3 font-semibold text-white border border-slate-700 hover:border-slate-500 transition-colors text-center">
            Refaire le test
          </a>
        </div>
      </main>
    );
  }

  if (stage === 'payment' && data) {
    return (
      <main className="min-h-screen px-6 py-16">
        <div className="max-w-md mx-auto">
          <button onClick={() => setStage('free')} className="text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors">
            ← Retour au résultat
          </button>

          <div className="text-center mb-8">
            <div className="text-5xl mb-3">{data.result.emoji}</div>
            <h1 className="text-2xl font-bold text-white mb-1">Rapport Premium</h1>
            <p className="text-slate-400 text-sm">18 sections · Analyse IA · Coaching carrière</p>
          </div>

          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 mb-6 space-y-2">
            {[
              '18 sections d\'analyse détaillée',
              'Style de leadership et communication',
              'Recommandations carrière personnalisées',
              'Conseils entretien sur mesure',
              'Coaching IA pour votre évolution',
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-indigo-400 mt-0.5">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="text-center mb-6">
            <span className="text-3xl font-bold text-white">$4.99</span>
            <span className="text-slate-500 text-sm ml-2">USD · paiement unique</span>
          </div>

          <PayPalButton assessmentId={id} onSuccess={generateReport} />

          <p className="text-center text-xs text-slate-600 mt-4">
            Paiement sécurisé via PayPal · Accès immédiat après paiement
          </p>
        </div>
      </main>
    );
  }

  if (stage === 'premium' && data?.premiumReport) {
    return (
      <main className="min-h-screen px-6 py-16">
        <PremiumReport result={data.result} report={data.premiumReport} />
        <div className="text-center mt-10">
          <a href="/personality/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
            Voir tous mes résultats →
          </a>
        </div>
      </main>
    );
  }

  if (stage === 'free' && data) {
    return (
      <main className="min-h-screen px-6 py-16">
        <FreeResult result={data.result} onUpgrade={() => setStage('payment')} />
        <div className="text-center mt-6">
          <a href="/personality/dashboard" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
            Voir mes résultats précédents
          </a>
        </div>
      </main>
    );
  }

  return null;
}
