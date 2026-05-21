'use client';

import { useState } from 'react';
import type { Question } from '@/types/personality';

interface Props {
  question: Question;
  questionNumber: number;
  total: number;
  onAnswer: (id: 'A' | 'B' | 'C' | 'D') => void;
}

export function QuestionCard({ question, questionNumber, total, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  function pick(id: 'A' | 'B' | 'C' | 'D') {
    if (selected) return;
    setSelected(id);
    setTimeout(() => onAnswer(id), 380);
  }

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-2">{question.category}</p>
      <h2 className="text-xl font-semibold text-white leading-snug mb-8">{question.text}</h2>
      <div className="space-y-3">
        {question.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isOther    = selected !== null && !isSelected;
          return (
            <button
              key={opt.id}
              onClick={() => pick(opt.id)}
              disabled={selected !== null}
              className={[
                'w-full text-left rounded-xl border px-5 py-4 flex items-start gap-4 transition-all duration-300',
                isSelected ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : isOther  ? 'border-slate-700 bg-slate-800/20 opacity-40'
                  : 'border-slate-700 bg-slate-800/50 hover:border-indigo-400 hover:bg-slate-800 hover:scale-[1.01]',
              ].join(' ')}
            >
              <span className={[
                'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors',
                isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400',
              ].join(' ')}>
                {opt.id}
              </span>
              <span className={['text-sm leading-relaxed', isSelected ? 'text-white' : 'text-slate-300'].join(' ')}>
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
