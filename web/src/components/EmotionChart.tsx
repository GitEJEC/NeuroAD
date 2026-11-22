import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Emotion } from '../api/client';

export type ChartType = 'bar' | 'pie';

type Props = {
  type: ChartType;
  emotions: Emotion[];
  counts: Record<string, number>;
};

// Only emotions with records in the range. No animation (low-distraction guide, rule 10).
export default function EmotionChart({ type, emotions, counts }: Props) {
  const data = emotions
    .filter((e) => counts[e.key])
    .map((e) => ({ name: `${e.emoji} ${e.label}`, value: counts[e.key], color: e.color }))
    .sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer width="100%" height={360}>
      {type === 'bar' ? (
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <XAxis dataKey="name" interval={0} tick={{ fontSize: 14 }} />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(v) => [v, 'Registros']} />
          <Bar dataKey="value" isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      ) : (
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={140} label isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      )}
    </ResponsiveContainer>
  );
}
