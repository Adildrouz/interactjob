'use client';

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Question {current} / {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #ec4899)' }}
        />
      </div>
    </div>
  );
}
