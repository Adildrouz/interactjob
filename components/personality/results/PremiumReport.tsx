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

export function PremiumReport({ result, report }: { result: PersonalityResult; report: PR }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{result.emoji}</div>
        <h1 className="text-2xl font-bold text-white">{result.label}</h1>
        <p className="text-slate-500 text-xs mt-1">Rapport Premium · {new Date(report.generatedAt).toLocaleDateString('fr-MA')}</p>
      </div>

      {SECTIONS.map(({ key, title, icon }) => {
        const isOpen = open === key;
        return (
          <div key={key} className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden print:border-gray-200 print:bg-white print:rounded-none print:border-0 print:border-b">
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
            {/* Always visible in print */}
            <div className="hidden print:block px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span>{icon}</span>
                <span className="font-semibold text-gray-900 text-sm">{title}</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{report[key]}</p>
            </div>
            {isOpen && (
              <div className="px-5 pb-5 pt-1 border-t border-slate-700 print:hidden">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{report[key]}</p>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-center text-xs text-slate-600 pt-4">Généré avec Claude AI · InteractJob Personality</p>
    </div>
  );
}
