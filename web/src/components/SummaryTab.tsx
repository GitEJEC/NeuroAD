import { useEffect, useState } from 'react';
import { Alert, Grid, Group, Loader, Paper, SegmentedControl, Stack, Text } from '@mantine/core';
import { api, type Emotion, type EmotionCount, type Kpis, type Range } from '../api/client';
import EmotionChart, { type ChartType } from './EmotionChart';
import EmotionLegend from './EmotionLegend';
import KpiCards from './KpiCards';

type Data = { kpis: Kpis; counts: Record<string, number> };

// Summary tab: one range filter drives both the KPIs and the emotion chart.
export default function SummaryTab({ patientId }: { patientId: string }) {
  const [range, setRange] = useState<Range>('week');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [emotions, setEmotions] = useState<Emotion[] | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Emotion[]>('/emotions')
      .then(setEmotions)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Old data stays on screen until the new range arrives (no loader flicker).
  useEffect(() => {
    let current = true; // ignore a slower response from a range the user already left
    const q = `?range=${range}`;
    Promise.all([
      api<Kpis>(`/patients/${patientId}/kpis${q}`),
      api<EmotionCount[]>(`/patients/${patientId}/emotions/summary${q}`),
    ])
      .then(([kpis, summary]) => {
        if (!current) return;
        setData({ kpis, counts: Object.fromEntries(summary.map((s) => [s.emotion_key, s.count])) });
        setError(null);
      })
      .catch((e: Error) => current && setError(e.message));
    return () => {
      current = false;
    };
  }, [patientId, range]);

  return (
    <Stack gap="lg">
      <SegmentedControl
        value={range}
        onChange={(v) => setRange(v as Range)}
        size="md"
        style={{ alignSelf: 'flex-start' }}
        data={[
          { value: 'day', label: 'Día' },
          { value: 'week', label: 'Semana' },
          { value: 'month', label: 'Mes' },
        ]}
      />
      {error && <Alert color="red">{error}</Alert>}
      {!error && (!data || !emotions) && <Loader />}
      {data && emotions && (
        <>
          <KpiCards kpis={data.kpis} emotions={emotions} />
          <Grid gap="lg">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper withBorder radius="md" p="lg" h="100%">
                <Group justify="space-between" mb="md">
                  <Text fw={600} size="lg">
                    Emociones registradas
                  </Text>
                  <SegmentedControl
                    value={chartType}
                    onChange={(v) => setChartType(v as ChartType)}
                    data={[
                      { value: 'bar', label: 'Barras' },
                      { value: 'pie', label: 'Torta' },
                    ]}
                  />
                </Group>
                {data.kpis.emotion_count === 0 ? (
                  <Text c="dimmed" py="xl">
                    No hay emociones registradas en este rango.
                  </Text>
                ) : (
                  <EmotionChart type={chartType} emotions={emotions} counts={data.counts} />
                )}
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder radius="md" p="lg" h="100%">
                <Text fw={600} size="lg" mb="md">
                  Leyenda
                </Text>
                <EmotionLegend emotions={emotions} counts={data.counts} />
              </Paper>
            </Grid.Col>
          </Grid>
        </>
      )}
    </Stack>
  );
}
