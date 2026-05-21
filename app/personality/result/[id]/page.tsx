'use client';

import { useEffect, useState, use } from 'react';
import { PremiumReport } from '@/components/personality/results/PremiumReport';
import { PayPalButton } from '@/components/personality/payment/PayPalButton';
import type { PersonalityResult, PremiumReport as PR } from '@/types/personality';

type Stage = 'loading' | 'payment' | 'generating' | 'premium' | 'error';

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
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { fetchResult(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function fetchResult() {
    try {
      const res = await fetch(`/api/personality/report/generate?assessmentId=${id}`);
      const json = await res.json() as { success: boolean; data?: AssessmentData; error?: string };
      if (!json.success || !json.data) { setErrorMsg(json.error ?? 'Résultat introuvable'); setStage('error'); return; }
      setData(json.data);
      setStage(json.data.isPremium && json.data.premiumReport ? 'premium' : 'payment');
    } catch { setErrorMsg('Erreur réseau'); setStage('error'); }
  }

  async function generateReport() {
    if (!data) return;
    setStage('generating');
    try {
      const res = await fetch('/api/personality/report/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: id }),
      });
      const json = await res.json() as { success: boolean; data?: { premiumReport: PR }; error?: string };
      if (!json.success || !json.data) { setErrorMsg(json.error ?? 'Génération échouée'); setStage('error'); return; }
      const updated = { ...data, isPremium: true, premiumReport: json.data.premiumReport };
      setData(updated);
      setStage('premium');
      // Auto-send email if provided
      if (email) sendEmail(email, json.data.premiumReport);
    } catch { setErrorMsg('Erreur lors de la génération du rapport'); setStage('error'); }
  }

  async function sendEmail(to: string, report?: PR) {
    if (!data) return;
    setSendingEmail(true); setEmailError('');
    try {
      const res = await fetch('/api/personality/report/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: id, email: to }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (json.success) setEmailSent(true);
      else setEmailError(json.error ?? 'Échec de l\'envoi');
    } catch { setEmailError('Erreur réseau'); } finally { setSendingEmail(false); }
  }

  function downloadPDF() {
    window.print();
  }

  if (stage === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-slate-400 text-sm">Calcul de votre profil…</p>
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
            <p className="text-slate-400 text-sm">L'IA analyse votre profil sur 18 dimensions. Environ 30 secondes.</p>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            {['Leadership', 'Communication', 'Carrière', 'Coaching IA'].map((label, i) => (
              <span key={label} className="text-xs text-slate-500 animate-pulse" style={{ animationDelay: `${i * 0.5}s` }}>
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
          <h2 className="text-xl font-semibold text-white mb-2">Une erreur est survenue</h2>
          <p className="text-slate-400 text-sm">{errorMsg}</p>
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
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{data.result.emoji}</div>
            <h1 className="text-2xl font-bold text-white mb-1">{data.result.label}</h1>
            <p className="text-slate-400 text-sm italic mb-4">"{data.result.tagline}"</p>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 text-xs text-indigo-400">
              🔒 Rapport complet disponible après paiement
            </div>
          </div>

          {/* Dimensions floutées */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 mb-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Vos 4 dimensions comportementales</p>
            {(['L', 'I', 'S', 'P'] as const).map(dim => {
              const labels = { L: 'Leader Energy', I: 'Influence Sociale', S: 'Stabilité & Support', P: 'Précision & Analyse' };
              const colors = { L: '#6366f1', I: '#ec4899', S: '#10b981', P: '#3b82f6' };
              return (
                <div key={dim}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>{labels[dim]}</span>
                    <span className="blur-sm select-none" style={{ color: colors[dim] }}>██%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full blur-sm" style={{ width: `${data.result.percentages[dim]}%`, backgroundColor: colors[dim] }} />
                  </div>
                </div>
              );
            })}
            <p className="text-center text-xs text-slate-600 pt-1">Débloquez le rapport pour voir vos scores exacts</p>
          </div>

          {/* Ce que contient le rapport */}
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-5 mb-5 space-y-2">
            <p className="text-sm font-semibold text-white mb-3">Ce que vous obtenez :</p>
            {[
              '18 sections d\'analyse complètes',
              'Style de leadership et communication',
              'Recommandations carrière personnalisées',
              'Conseils pour vos entretiens d\'embauche',
              'Gestion du stress et productivité',
              'Coaching IA pour votre évolution de carrière',
              '📄 Rapport PDF téléchargeable',
              '📧 Livré par email immédiatement',
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-sm text-slate-400 mb-1.5">
              Votre email <span className="text-slate-600">(pour recevoir le rapport)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="text-center mb-5">
            <span className="text-4xl font-bold text-white">$4.99</span>
            <span className="text-slate-500 text-sm ml-2">USD · accès à vie</span>
          </div>

          <PayPalButton assessmentId={id} onSuccess={generateReport} />

          <p className="text-center text-xs text-slate-600 mt-4">
            Paiement sécurisé via PayPal · PDF téléchargeable · Envoi email instantané
          </p>
        </div>
      </main>
    );
  }

  if (stage === 'premium' && data?.premiumReport) {
    return (
      <>
        {/* Print styles */}
        <style>{`
          @media print {
            body { background: white !important; color: black !important; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            main { padding: 0 !important; }
          }
        `}</style>

        <main className="min-h-screen px-6 py-16">
          {/* Actions bar */}
          <div className="no-print max-w-2xl mx-auto flex items-center justify-between mb-8 flex-wrap gap-3">
            <a href="/personality/assessment" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
              ← Refaire le test
            </a>
            <div className="flex items-center gap-3">
              {/* Email re-send */}
              <div className="flex items-center gap-2">
                {!emailSent ? (
                  <>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none w-48"
                    />
                    <button
                      onClick={() => sendEmail(email)}
                      disabled={!email || sendingEmail}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-40 whitespace-nowrap"
                    >
                      {sendingEmail ? 'Envoi…' : '📧 Envoyer par email'}
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-green-400 font-medium">✓ Rapport envoyé par email</span>
                )}
                {emailError && <span className="text-xs text-red-400">{emailError}</span>}
              </div>

              {/* Download PDF */}
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}
              >
                📄 Télécharger PDF
              </button>
            </div>
          </div>

          <PremiumReport result={data.result} report={data.premiumReport} />

          <div className="no-print text-center mt-8">
            <a href="/personality/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
              Voir tous mes résultats →
            </a>
          </div>
        </main>
      </>
    );
  }

  return null;
}
