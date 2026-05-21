'use client';

import type { PersonalityResult } from '@/types/personality';
import { RadarChart } from './RadarChart';

const DIM_LABELS = { L: 'Leader Energy', I: 'Influence Sociale', S: 'Stabilité', P: 'Précision' };

export function FreeResult({ result, onUpgrade }: { result: PersonalityResult; onUpgrade: () => void }) {
  const sorted = (Object.entries(result.percentages) as [string, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl p-8 text-center border" style={{ background: `linear-gradient(135deg,${result.color}22,transparent)`, borderColor: `${result.color}44` }}>
        <div className="text-6xl mb-4">{result.emoji}</div>
        <h1 className="text-3xl font-bold text-white mb-2">{result.label}</h1>
        <p className="text-slate-400">{result.tagline}</p>
      </div>

      {/* Radar */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Profil comportemental</p>
        <RadarChart percentages={result.percentages} color={result.color} />
      </div>

      {/* Bars */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Dimensions</p>
        {sorted.map(([key, pct]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300">{DIM_LABELS[key as keyof typeof DIM_LABELS]}</span>
              <span className="font-semibold" style={{ color: result.color }}>{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-700">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: result.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Upsell */}
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-2">🔒 Débloquer le Rapport Premium</h3>
        <p className="text-slate-400 text-sm mb-4">18 sections détaillées : forces, faiblesses, leadership, communication, stress, carrière et coaching IA — personnalisées pour ton profil.</p>
        <ul className="space-y-1.5 text-sm text-slate-400 mb-5">
          {['Recommandations de carrière', 'Conseils pour les entretiens', 'Style de management idéal', 'Coaching IA personnalisé', 'Environnement de travail idéal'].map(i => (
            <li key={i} className="flex gap-2"><span className="text-indigo-400">✓</span>{i}</li>
          ))}
        </ul>
        <button onClick={onUpgrade} className="w-full rounded-xl py-3.5 font-semibold text-white hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(90deg,#6366f1,#ec4899)' }}>
          Obtenir le Rapport Premium — $4.99
        </button>
      </div>
    </div>
  );
}
