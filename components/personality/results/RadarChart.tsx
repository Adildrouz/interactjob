'use client';

import { Radar, RadarChart as RC, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { DimensionScores } from '@/types/personality';

const LABELS: Record<keyof DimensionScores, string> = { L: 'Leader', I: 'Influence', S: 'Stabilité', P: 'Précision' };

export function RadarChart({ percentages, color }: { percentages: DimensionScores; color: string }) {
  const data = (Object.entries(percentages) as [keyof DimensionScores, number][])
    .map(([k, v]) => ({ dimension: LABELS[k], value: v, fullMark: 100 }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <RC data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <Radar name="Score" dataKey="value" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
      </RC>
    </ResponsiveContainer>
  );
}
