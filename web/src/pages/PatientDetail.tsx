import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Anchor, Container, Loader, Tabs, Text, Title } from '@mantine/core';
import { api, type User } from '../api/client';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<User>(`/patients/${id}`)
      .then((p) => {
        setPatient(p);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  // Hide the previous patient while another one loads (e.g. navigating from the bell).
  const current = patient?.id === Number(id) ? patient : null;

  return (
    <Container size="lg">
      <Anchor component={Link} to="/" size="sm">
        ← Volver a pacientes
      </Anchor>
      {error && (
        <Alert color="red" mt="md">
          {error}
        </Alert>
      )}
      {!current && !error && <Loader mt="md" />}
      {current && (
        <>
          <Title order={2} my="md">
            {current.full_name}
          </Title>
          <Tabs defaultValue="summary">
            <Tabs.List>
              <Tabs.Tab value="summary">Resumen</Tabs.Tab>
              <Tabs.Tab value="tasks">Tareas</Tabs.Tab>
              <Tabs.Tab value="tips">Consejos</Tabs.Tab>
            </Tabs.List>
            {/* Tab content arrives in phases 4 (summary) and 5 (tasks, tips). */}
            <Tabs.Panel value="summary" pt="md">
              <Text c="dimmed">Aquí verás el resumen de emociones y parálisis.</Text>
            </Tabs.Panel>
            <Tabs.Panel value="tasks" pt="md">
              <Text c="dimmed">Aquí podrás crear y editar tareas.</Text>
            </Tabs.Panel>
            <Tabs.Panel value="tips" pt="md">
              <Text c="dimmed">Aquí podrás editar los consejos.</Text>
            </Tabs.Panel>
          </Tabs>
        </>
      )}
    </Container>
  );
}
