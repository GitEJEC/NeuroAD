import { useState } from 'react';
import { Alert, Button, Group, Modal, Stack, TextInput, Textarea } from '@mantine/core';
import { api, type Tip } from '../api/client';

type Props = {
  patientId: string;
  tip: Tip | null; // null = new tip
  onClose: () => void;
  onSaved: () => void;
};

export default function TipEditor({ patientId, tip, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(tip?.title ?? '');
  const [body, setBody] = useState(tip?.body ?? '');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function save() {
    const t = title.trim();
    const b = body.trim();
    setTitleError(t ? null : 'Escribe un título.');
    setBodyError(b ? null : 'Escribe el texto del consejo.');
    if (!t || !b) return;

    setBusy(true);
    setError(null);
    const path = tip ? `/patients/${patientId}/tips/${tip.id}` : `/patients/${patientId}/tips`;
    api<Tip>(path, { method: tip ? 'PUT' : 'POST', body: JSON.stringify({ title: t, body: b }) })
      .then(onSaved)
      .catch((e: Error) => {
        setError(e.message);
        setBusy(false);
      });
  }

  return (
    <Modal opened onClose={onClose} title={tip ? 'Editar consejo' : 'Nuevo consejo'} size="lg">
      <Stack gap="md">
        <TextInput
          label="Título"
          placeholder="Por ejemplo: Usa un temporizador corto"
          value={title}
          onChange={(e) => {
            setTitle(e.currentTarget.value);
            setTitleError(null);
          }}
          error={titleError}
          data-autofocus
        />
        <Textarea
          label="Texto"
          placeholder="Frases cortas, en segunda persona"
          autosize
          minRows={3}
          value={body}
          onChange={(e) => {
            setBody(e.currentTarget.value);
            setBodyError(null);
          }}
          error={bodyError}
        />
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
