import { useEffect, useRef } from 'react';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { formatDateTime, type Paralysis } from '../api/client';

type Props = {
  reports: Paralysis[];
  highlightId: number | null;
};

// Full paralysis log of one patient. "Nuevo" uses seen_by_therapist as it was when the tab loaded.
export default function ParalysisFeed({ reports, highlightId }: Props) {
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ block: 'center' });
  }, [highlightId]);

  if (reports.length === 0) {
    return <Text c="dimmed">Este paciente aún no tiene reportes de parálisis.</Text>;
  }

  return (
    <Stack gap="md">
      <Text c="dimmed">
        {reports.length} {reports.length === 1 ? 'reporte' : 'reportes'}, del más reciente al más antiguo.
      </Text>
      {reports.map((r) => {
        const picked = r.id === highlightId;
        return (
          <Paper
            key={r.id}
            ref={picked ? highlightRef : undefined}
            withBorder
            p="lg"
            radius="md"
            bg={picked ? 'indigo.0' : undefined}
            style={picked ? { borderColor: 'var(--mantine-color-indigo-6)', borderWidth: 3 } : undefined}
            aria-current={picked ? 'true' : undefined}
          >
            <Group justify="space-between" mb="xs">
              <Text fw={600} size="lg">
                {formatDateTime(r.pressed_at)}
              </Text>
              <Group gap="xs">
                {picked && <Badge color="indigo">Seleccionado</Badge>}
                {!r.seen_by_therapist && <Badge color="orange">Nuevo</Badge>}
              </Group>
            </Group>
            <Text c={r.description ? undefined : 'dimmed'}>{r.description ?? 'Sin descripción'}</Text>
          </Paper>
        );
      })}
    </Stack>
  );
}
