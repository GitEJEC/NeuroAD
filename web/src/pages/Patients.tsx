import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Badge, Button, Container, Loader, Table, Text, Title } from '@mantine/core';
import { api, formatDateTime, type PatientItem } from '../api/client';

export default function Patients() {
  const navigate = useNavigate();
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
    <Container size="md">
      <Title order={2} mb="md">
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
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Última parálisis</Table.Th>
              <Table.Th>Sin ver</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {patients.map((p) => (
              <Table.Tr key={p.id} onClick={() => navigate(`/patients/${p.id}`)} style={{ cursor: 'pointer' }}>
                <Table.Td>
                  <Text fw={500}>{p.full_name}</Text>
                  <Text size="sm" c="dimmed">
                    {p.email}
                  </Text>
                </Table.Td>
                <Table.Td>{p.last_paralysis_at ? formatDateTime(p.last_paralysis_at) : 'Sin reportes'}</Table.Td>
                <Table.Td>
                  {p.unseen_count > 0 ? <Badge color="red">{p.unseen_count} sin ver</Badge> : <Text c="dimmed">—</Text>}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  );
}
