import { Paper, SimpleGrid, Text } from '@mantine/core';
import { formatDateTime, type Emotion, type Kpis } from '../api/client';

type Props = {
  kpis: Kpis;
  emotions: Emotion[];
};

export default function KpiCards({ kpis, emotions }: Props) {
  const top = emotions.find((e) => e.key === kpis.top_emotion);
  const cards = [
    { label: 'Parálisis en el rango', value: String(kpis.paralysis_count) },
    {
      label: 'Última parálisis',
      value: kpis.last_paralysis_at ? formatDateTime(kpis.last_paralysis_at) : 'Sin parálisis',
    },
    { label: 'Emociones registradas', value: String(kpis.emotion_count) },
    { label: 'Emoción más frecuente', value: top ? `${top.emoji} ${top.label}` : '—' },
    { label: 'Tareas 👍 / 👎', value: `👍 ${kpis.tasks_liked} · 👎 ${kpis.tasks_disliked}` },
  ];

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {cards.map((c) => (
        <Paper key={c.label} withBorder radius="md" p="lg">
          <Text c="dimmed">{c.label}</Text>
          <Text fw={700} fz={26}>
            {c.value}
          </Text>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
