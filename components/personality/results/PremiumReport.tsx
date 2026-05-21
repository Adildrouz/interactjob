'use client';

import { useState } from 'react';
import type { PersonalityResult, PremiumReport as PR } from '@/types/personality';

const SECTIONS: { key: keyof Omit<PR, 'generatedAt'>; title: string; icon: string }[] = [
  { key: 'overview',                 title: 'Vue d\'ensemble',           icon: '🧠' },
  { key: 'coreStrengths',            title: 'Forces principales',         icon: '💪' },
  { key: 'potentialWeaknesses',      title: 'Axes de progression',        icon: '🎯' },
  { key: 'leadershipStyle',          title: 'Style de leadership',        icon: '👑' },
  { key: 'communicationStyle',       title: 'Communication',              icon: '💬' },
  { key: 'teamworkBehavior',         title: 'Dynamique d\'équipe',        icon: '🤝' },
  { key: 'stressResponse',           title: 'Gestion du stress',          icon: '⚡' },
  { key: 'workplaceCompatibility',   title: 'Compatibilité pro',          icon: '🏢' },
  { key: 'productivityHabits',       title: 'Habitudes de productivité',  icon: '⏰' },
  { key: 'idealWorkEnvironment',     title: 'Environnement idéal',        icon: '🌿' },
  { key: 'careerRecommendations',    title: 'Recommandations carrière',   icon: '🚀' },
  { key: 'interviewAdvice',          title: 'Conseils entretien',         icon: '🎤' },
  { key: 'bestManagementStyle',      title: 'Management idéal',           icon: '📋' },
  { key: 'relationshipWithColleagues', title: 'Relations collègues',      icon: '👥' },
  { key: 'decisionMakingStyle',      title: 'Prise de décision',          icon: '⚖️' },
  { key: 'careerGrowthAdvice',       title: 'Évolution de carrière',      icon: '📈' },
  { key: 'workplaceRisks',           title: 'Risques professionnels',     icon: '⚠️' },
  { key: 'aiCareerCoaching',         title: 'Coaching IA',                icon: '🤖' },
];

interface Props {
  result: PersonalityResult;
  report: PR;
  candidateName?: string;
}

export function PremiumReport({ result, report, candidateName }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const date = new Date(report.generatedAt).toLocaleDateString('fr-MA', { day: 'numeric', month: 'long', year: 'numeric' });
  const dimLabels = { L: 'Leader Energy', I: 'Influence Sociale', S: 'Stabilité', P: 'Précision' };
  const dimColors = { L: '#6366f1', I: '#ec4899', S: '#10b981', P: '#3b82f6' };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* Certificate */}
      <div className="rounded-2xl overflow-hidden border border-indigo-500/30 print:border-gray-300">
        {/* Gradient header */}
        <div className="p-8 text-center print:bg-gray-50" style={{ background: 'linear-gradient(135deg,#6366f1,#ec4899)' }}>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-[3px] mb-4 print:text-gray-500">
            Certificat d'Évaluation de Personnalité Professionnelle
          </p>
          <div className="text-5xl mb-3">{result.emoji}</div>
          <h1 className="text-2xl font-bold text-white mb-1 print:text-gray-900">{result.label}</h1>
          <p className="text-white/80 text-sm italic print:text-gray-600">"{result.tagline}"</p>
          {candidateName && (
            <div className="mt-4 inline-block rounded-full bg-white/20 px-5 py-2 print:bg-gray-100">
              <p className="text-white font-semibold text-sm print:text-gray-900">Préparé pour : {candidateName}</p>
            </div>
          )}
        </div>

        {/* Scores */}
        <div className="bg-slate-900/60 px-6 py-5 print:bg-gray-50 print:border-t print:border-gray-200">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4 print:text-gray-500">Profil comportemental</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {(['L', 'I', 'S', 'P'] as const).map(dim => (
              <div key={dim}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 print:text-gray-600">{dimLabels[dim]}</span>
                  <span className="font-bold" style={{ color: dimColors[dim] }}>{result.percentages[dim]}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 print:bg-gray-200 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${result.percentages[dim]}%`, backgroundColor: dimColors[dim] }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-600 mt-4 print:text-gray-400">
            Généré le {date} · InteractJob Personality AI
          </p>
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map(({ key, title, icon }) => {
        const isOpen = open === key;
        return (
          <div key={key} className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden print:border-gray-200 print:bg-white print:rounded-none print:border-0 print:border-b">
            {/* Screen: accordion */}
            <button
              onClick={() => setOpen(isOpen ? null : key)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800 transition-colors print:hidden"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="font-medium text-white text-sm">{title}</span>
              </div>
              <span className={['text-slate-400 transition-transform duration-300', isOpen ? 'rotate-180' : ''].join(' ')}>▾</span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 border-t border-slate-700 print:hidden">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{report[key]}</p>
              </div>
            )}
            {/* Print: always visible */}
            <div className="hidden print:block px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span>{icon}</span>
                <span className="font-semibold text-gray-900 text-sm">{title}</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{report[key]}</p>
            </div>
          </div>
        );
      })}

      <p className="text-center text-xs text-slate-600 pt-4 print:text-gray-400">
        Généré avec Claude AI · InteractJob Personality
      </p>
    </div>
  );
}
