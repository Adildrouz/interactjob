'use client';

import { useEffect, useState, use } from 'react';
import { PremiumReport } from '@/components/personality/results/PremiumReport';
import { PayPalButton } from '@/components/personality/payment/PayPalButton';
import { PROFILES } from '@/lib/personality/profiles';
import type { PersonalityResult, PremiumReport as PR } from '@/types/personality';

type Stage = 'loading' | 'free' | 'generating' | 'premium' | 'error';

interface AssessmentData {
  result: PersonalityResult;
  isPremium: boolean;
  premiumReport?: PR;
  candidateName?: string;
}

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [stage, setStage] = useState<Stage>('loading');
  const [data, setData] = useState<AssessmentData | null>(null);
  const [candidateName, setCandidateName] = useState('');
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
      if (json.data.candidateName) setCandidateName(json.data.candidateName);
      setStage(json.data.isPremium && json.data.premiumReport ? 'premium' : 'free');
    } catch { setErrorMsg('Erreur réseau'); setStage('error'); }
  }

  async function generateReport() {
    if (!data) return;
    setStage('generating');
    try {
      const res = await fetch('/api/personality/report/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: id, candidateName: candidateName || undefined }),
      });
      const json = await res.json() as { success: boolean; data?: { premiumReport: PR; candidateName?: string }; error?: string };
      if (!json.success || !json.data) { setErrorMsg(json.error ?? 'Génération échouée'); setStage('error'); return; }
      const updated: AssessmentData = { ...data, isPremium: true, premiumReport: json.data.premiumReport, candidateName: json.data.candidateName ?? candidateName };
      setData(updated);
      setStage('premium');
      if (email) sendEmail(email);
    } catch { setErrorMsg('Erreur lors de la génération du rapport'); setStage('error'); }
  }

  async function sendEmail(to: string) {
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
          <div className="flex justify-center gap-3 flex-wrap">
            {['Leadership', 'Communication', 'Carrière', 'Coaching IA'].map((label, i) => (
              <span key={label} className="text-xs text-slate-500 animate-pulse" style={{ animationDelay: `${i * 0.5}s` }}>{label}…</span>
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
          <h2 className="text-xl font-semibold text-white">Une erreur est survenue</h2>
          <p className="text-slate-400 text-sm">{errorMsg}</p>
          <a href="/personality/assessment" className="block w-full rounded-xl py-3 font-semibold text-white border border-slate-700 hover:border-slate-500 transition-colors text-center">
            Refaire le test
          </a>
        </div>
      </main>
    );
  }

  if (stage === 'free' && data) {
    const profile = PROFILES[data.result.dominantType];
    const dimLabels = { L: 'Leader Energy', I: 'Influence Sociale', S: 'Stabilité & Support', P: 'Précision & Analyse' };
    const dimColors = { L: '#6366f1', I: '#ec4899', S: '#10b981', P: '#3b82f6' };

    return (
      <main className="min-h-screen px-6 py-12">
        <div className="max-w-2xl mx-auto space-y-5">

          {/* Identity card */}
          <div className="text-center py-8 rounded-2xl border border-slate-800 bg-slate-900/50">
            <div className="text-7xl mb-4">{data.result.emoji}</div>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wider mb-4" style={{ background: `${data.result.color}20`, color: data.result.color }}>
              Votre profil de personnalité
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{data.result.label}</h1>
            <p className="text-slate-400 italic px-6">"{data.result.tagline}"</p>
          </div>

          {/* Dimension scores — visible & unlocked */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Vos 4 dimensions comportementales</p>
            {(['L', 'I', 'S', 'P'] as const).map(dim => {
              const pct = data.result.percentages[dim];
              return (
                <div key={dim} className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">{dimLabels[dim]}</span>
                    <span className="font-bold" style={{ color: dimColors[dim] }}>{pct}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: dimColors[dim] }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Free summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Votre profil en résumé</p>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">{profile.summary}</p>
            <div className="flex flex-wrap gap-2">
              {profile.strengths.map(s => (
                <span key={s} className="text-xs px-3 py-1.5 rounded-full border font-medium" style={{ borderColor: `${data.result.color}50`, color: data.result.color, background: `${data.result.color}10` }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Premium upsell */}
          <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-indigo-500/5 to-transparent p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)' }}>🏆</div>
              <div>
                <h2 className="text-lg font-bold text-white">Rapport Complet Personnalisé</h2>
                <p className="text-slate-500 text-xs">18 sections · PDF · Email · Certificat nominatif</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {[
                ['📊', '18 sections d\'analyse complètes'],
                ['👑', 'Style de leadership & communication'],
                ['🚀', 'Recommandations carrière personnalisées'],
                ['🎤', 'Conseils pour vos entretiens d\'embauche'],
                ['⚡', 'Gestion du stress & productivité'],
                ['🤖', 'Coaching IA pour votre évolution'],
                ['📄', 'Rapport PDF téléchargeable'],
                ['📧', 'Livré par email immédiatement'],
                ['🏅', 'Certificat nominatif officiel'],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="flex-shrink-0">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Prénom & Nom <span className="text-slate-600">(pour le certificat nominatif)</span>
                </label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={e => setCandidateName(e.target.value)}
                  placeholder="Ex : Mohamed Alami"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Email <span className="text-slate-600">(pour recevoir le rapport)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="text-center mb-5">
              <span className="text-4xl font-bold text-white">$4.99</span>
              <span className="text-slate-500 text-sm ml-2">USD · rapport PDF complet</span>
            </div>

            <PayPalButton assessmentId={id} onSuccess={generateReport} />

            <p className="text-center text-xs text-slate-600 mt-3">
              Paiement sécurisé via PayPal · PDF téléchargeable · Envoi email instantané
            </p>
          </div>

          <p className="text-center text-xs text-slate-700">
            <a href="/personality/assessment" className="hover:text-slate-500 transition-colors">← Refaire le test</a>
          </p>
        </div>
      </main>
    );
  }

  if (stage === 'premium' && data?.premiumReport) {
    return (
      <>
        <style>{`
          @media print {
            body { background: white !important; color: black !important; }
            .no-print { display: none !important; }
            main { padding: 0 !important; }
          }
        `}</style>

        <main className="min-h-screen px-6 py-16">
          {/* Actions bar */}
          <div className="no-print max-w-2xl mx-auto flex items-center justify-between mb-8 flex-wrap gap-3">
            <a href="/personality/assessment" className="text-slate-500 hover:text-slate-400 text-sm transition-colors">
              ← Refaire le test
            </a>
            <div className="flex items-center gap-3 flex-wrap">
              {!emailSent ? (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 text-xs focus:border-indigo-500 focus:outline-none w-44"
                  />
                  <button
                    onClick={() => sendEmail(email)}
                    disabled={!email || sendingEmail}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-40 whitespace-nowrap"
                  >
                    {sendingEmail ? 'Envoi…' : '📧 Envoyer'}
                  </button>
                </>
              ) : (
                <span className="text-xs text-green-400 font-medium">✓ Rapport envoyé</span>
              )}
              {emailError && <span className="text-xs text-red-400">{emailError}</span>}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}
              >
                📄 Télécharger PDF
              </button>
            </div>
          </div>

          <PremiumReport result={data.result} report={data.premiumReport} candidateName={data.candidateName} />

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
