import { useState } from 'react';
import { ActionIcon, Alert, Button, Group, Modal, Stack, Text, TextInput, Textarea } from '@mantine/core';
import { api, type Task } from '../api/client';

type Props = {
  patientId: string;
  task: Task | null; // null = new task
  onClose: () => void;
  onSaved: () => void;
};

// Title + editable list of micro-steps. Saving sends the whole list (the backend replaces it).
export default function TaskEditor({ patientId, task, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [steps, setSteps] = useState<string[]>(task?.steps ?? ['']);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [stepsError, setStepsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setStep = (i: number, text: string) => {
    setSteps(steps.map((s, j) => (j === i ? text : s)));
    setStepsError(null);
  };
  const removeStep = (i: number) => setSteps(steps.filter((_, j) => j !== i));
  const moveStep = (i: number, delta: number) => {
    const next = [...steps];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    setSteps(next);
  };

  function save() {
    const cleanTitle = title.trim();
    const cleanSteps = steps.map((s) => s.trim()).filter(Boolean); // empty steps are dropped
    setTitleError(cleanTitle ? null : 'Escribe un título.');
    setStepsError(cleanSteps.length > 0 ? null : 'Agrega al menos un micropaso.');
    if (!cleanTitle || cleanSteps.length === 0) return;

    setBusy(true);
    setError(null);
    const path = task ? `/patients/${patientId}/tasks/${task.id}` : `/patients/${patientId}/tasks`;
    api<Task>(path, {
      method: task ? 'PUT' : 'POST',
      body: JSON.stringify({ title: cleanTitle, steps: cleanSteps }),
    })
      .then(onSaved)
      .catch((e: Error) => {
        setError(e.message);
        setBusy(false);
      });
  }

  return (
    <Modal opened onClose={onClose} title={task ? 'Editar tarea' : 'Nueva tarea'} size="xl">
      <Stack gap="md">
        <TextInput
          label="Título"
          placeholder="Por ejemplo: Hacer la cama"
          value={title}
          onChange={(e) => {
            setTitle(e.currentTarget.value);
            setTitleError(null);
          }}
          error={titleError}
          data-autofocus
        />
        <div>
          <Text fw={600} mb="xs">
            Micropasos
          </Text>
          <Stack gap="sm">
            {steps.map((step, i) => (
              <Group key={i} align="flex-start" wrap="nowrap" gap="xs">
                <Text fw={600} w={28} pt={8}>
                  {i + 1}.
                </Text>
                <Textarea
                  style={{ flex: 1 }}
                  autosize
                  minRows={1}
                  placeholder="Una sola idea por paso"
                  value={step}
                  onChange={(e) => setStep(i, e.currentTarget.value)}
                  aria-label={`Paso ${i + 1}`}
                />
                <ActionIcon
                  variant="default"
                  size="lg"
                  onClick={() => moveStep(i, -1)}
                  disabled={i === 0}
                  aria-label={`Subir paso ${i + 1}`}
                >
                  ↑
                </ActionIcon>
                <ActionIcon
                  variant="default"
                  size="lg"
                  onClick={() => moveStep(i, 1)}
                  disabled={i === steps.length - 1}
                  aria-label={`Bajar paso ${i + 1}`}
                >
                  ↓
                </ActionIcon>
                <ActionIcon
                  variant="default"
                  color="red"
                  size="lg"
                  onClick={() => removeStep(i)}
                  aria-label={`Eliminar paso ${i + 1}`}
                >
                  ✕
                </ActionIcon>
              </Group>
            ))}
          </Stack>
          {stepsError && (
            <Text c="red" size="sm" mt="xs">
              {stepsError}
            </Text>
          )}
          <Button variant="light" mt="sm" onClick={() => setSteps([...steps, ''])}>
            + Agregar paso
          </Button>
        </div>
        {error && <Alert color="red">{error}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} loading={busy}>
            Guardar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
