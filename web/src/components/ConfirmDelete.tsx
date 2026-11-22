import { useState } from 'react';
import { Alert, Button, Group, Modal, Text } from '@mantine/core';

type Props = {
  title: string; // name of the thing being deleted, shown in the message
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

// Small confirmation dialog for deletes (no @mantine/modals needed).
export default function ConfirmDelete({ title, onCancel, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setBusy(true);
    onConfirm().catch((e: Error) => {
      setError(e.message);
      setBusy(false);
    });
  }

  return (
    <Modal opened onClose={onCancel} title="¿Eliminar?" centered>
      <Text mb="md">
        Vas a eliminar «{title}». El paciente dejará de verlo. Esto no se puede deshacer.
      </Text>
      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}
      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>
          Cancelar
        </Button>
        <Button color="red" onClick={confirm} loading={busy}>
          Eliminar
        </Button>
      </Group>
    </Modal>
  );
}
