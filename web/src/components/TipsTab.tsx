import { useCallback, useEffect, useState } from 'react';
import { ActionIcon, Alert, Button, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { api, type Tip } from '../api/client';
import ConfirmDelete from './ConfirmDelete';
import TipEditor from './TipEditor';

// Tips tab: list in the order the patient sees them, create/edit/delete and move up/down.
export default function TipsTab({ patientId }: { patientId: string }) {
  const [tips, setTips] = useState<Tip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Tip | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Tip | null>(null);
  const [moving, setMoving] = useState(false);

  const load = useCallback(() => {
    return api<Tip[]>(`/patients/${patientId}/tips`)
      .then((t) => {
        setTips(t);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  // Swap positions with the neighbour using the existing PUT (it accepts an optional position).
  function move(i: number, delta: number) {
    if (!tips) return;
    const a = tips[i];
    const b = tips[i + delta];
    const put = (tip: Tip, position: number) =>
      api(`/patients/${patientId}/tips/${tip.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: tip.title, body: tip.body, position }),
      });
    setMoving(true);
    Promise.all([put(a, b.position), put(b, a.position)])
      .catch((e: Error) => setError(e.message))
      .then(load)
      .finally(() => setMoving(false));
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text c="dimmed">Lo que el paciente ve en «Qué hacer», en este orden.</Text>
        <Button onClick={() => setEditing('new')}>+ Nuevo consejo</Button>
      </Group>
      {error && <Alert color="red">{error}</Alert>}
      {!tips && !error && <Loader />}
      {tips?.length === 0 && (
        <Text c="dimmed">Este paciente aún no tiene consejos. Crea el primero con «Nuevo consejo».</Text>
      )}
      {tips?.map((t, i) => (
        <Paper key={t.id} withBorder p="lg" radius="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <div style={{ flex: 1 }}>
              <Text fw={600} size="lg" mb={4}>
                {t.title}
              </Text>
              <Text>{t.body}</Text>
            </div>
            <Stack gap="xs" align="flex-end">
              <Group gap="xs">
                <ActionIcon
                  variant="default"
                  size="lg"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || moving}
                  aria-label={`Subir «${t.title}»`}
                >
                  ↑
                </ActionIcon>
                <ActionIcon
                  variant="default"
                  size="lg"
                  onClick={() => move(i, 1)}
                  disabled={i === tips.length - 1 || moving}
                  aria-label={`Bajar «${t.title}»`}
                >
                  ↓
                </ActionIcon>
              </Group>
              <Group gap="xs">
                <Button variant="default" onClick={() => setEditing(t)}>
                  Editar
                </Button>
                <Button variant="subtle" color="red" onClick={() => setDeleting(t)}>
                  Eliminar
                </Button>
              </Group>
            </Stack>
          </Group>
        </Paper>
      ))}
      {editing && (
        <TipEditor
          patientId={patientId}
          tip={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title={deleting.title}
          onCancel={() => setDeleting(null)}
          onConfirm={() =>
            api(`/patients/${patientId}/tips/${deleting.id}`, { method: 'DELETE' }).then(() => {
              setDeleting(null);
              load();
            })
          }
        />
      )}
    </Stack>
  );
}
