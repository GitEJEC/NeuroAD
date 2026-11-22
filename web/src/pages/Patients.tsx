import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Badge, Button, Container, Group, Loader, Paper, SimpleGrid, Text, Title } from '@mantine/core';
import { api, formatDateTime, type PatientItem } from '../api/client';

export default function Patients() {
  const [patients, setPatients] = useState<PatientItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api<PatientItem[]>('/patients')
      .then((data) => {
        setPatients(data);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }

  useEffect(load, []);

  return (
    <Container size="lg">
      <Title order={1} fz={32} mb="lg">
        Tus pacientes
      </Title>
      {error && (
        <Alert color="red" mb="md">
          {error}{' '}
          <Button size="xs" variant="white" onClick={load}>
            Reintentar
          </Button>
        </Alert>
      )}
      {!patients && !error && <Loader />}
      {patients?.length === 0 && <Text>Aún no tienes pacientes asignados.</Text>}
      {patients && patients.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {patients.map((p) => (
            <Paper
              key={p.id}
              component={Link}
              to={`/patients/${p.id}`}
              withBorder
              shadow="xs"
              radius="lg"
              p="xl"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                  <Text fw={600} fz={22}>
                    {p.full_name}
                  </Text>
                  <Text c="dimmed">{p.email}</Text>
                </div>
                {p.unseen_count > 0 && (
                  <Badge color="orange" size="lg">
                    {p.unseen_count} sin ver
                  </Badge>
                )}
              </Group>
              <Text mt="md">
                Última parálisis: {p.last_paralysis_at ? formatDateTime(p.last_paralysis_at) : 'sin reportes'}
              </Text>
            </Paper>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
