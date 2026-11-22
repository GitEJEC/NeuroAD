import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Group, Loader, Paper, Stack, Text } from '@mantine/core';
import { api, formatDateTime, type Task } from '../api/client';
import ConfirmDelete from './ConfirmDelete';
import TaskEditor from './TaskEditor';

function Feedback({ task }: { task: Task }) {
  if (!task.feedback) {
    return <Badge color="gray" variant="light">Sin respuesta</Badge>;
  }
  const like = task.feedback === 'like';
  return (
    <Group gap="xs">
      <Badge color={like ? 'teal' : 'orange'} variant="light">
        {like ? '👍 Le sirvió' : '👎 No le sirvió'}
      </Badge>
      {task.feedback_at && (
        <Text size="sm" c="dimmed">
          {formatDateTime(task.feedback_at)}
        </Text>
      )}
    </Group>
  );
}

// Tasks tab: list with the patient's current feedback, create/edit in TaskEditor, delete with confirmation.
export default function TasksTab({ patientId }: { patientId: string }) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const load = useCallback(() => {
    api<Task[]>(`/patients/${patientId}/tasks`)
      .then((t) => {
        setTasks(t);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [patientId]);

  useEffect(load, [load]);

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text c="dimmed">Lo que el paciente ve en la pestaña Tareas de su app.</Text>
        <Button onClick={() => setEditing('new')}>+ Nueva tarea</Button>
      </Group>
      {error && <Alert color="red">{error}</Alert>}
      {!tasks && !error && <Loader />}
      {tasks?.length === 0 && (
        <Text c="dimmed">Este paciente aún no tiene tareas. Crea la primera con «Nueva tarea».</Text>
      )}
      {tasks?.map((t) => (
        <Paper key={t.id} withBorder p="lg" radius="md">
          <Group justify="space-between" align="flex-start" mb="xs">
            <div>
              <Text fw={600} size="lg">
                {t.title}
              </Text>
              <Text size="sm" c="dimmed">
                {t.steps.length} {t.steps.length === 1 ? 'micropaso' : 'micropasos'}
              </Text>
            </div>
            <Group gap="xs">
              <Button variant="default" onClick={() => setEditing(t)}>
                Editar
              </Button>
              <Button variant="subtle" color="red" onClick={() => setDeleting(t)}>
                Eliminar
              </Button>
            </Group>
          </Group>
          <Feedback task={t} />
        </Paper>
      ))}
      {editing && (
        <TaskEditor
          patientId={patientId}
          task={editing === 'new' ? null : editing}
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
            api(`/patients/${patientId}/tasks/${deleting.id}`, { method: 'DELETE' }).then(() => {
              setDeleting(null);
              load();
            })
          }
        />
      )}
    </Stack>
  );
}
