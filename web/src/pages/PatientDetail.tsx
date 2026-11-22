import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Anchor, Badge, Container, Loader, Paper, Tabs, Text, Title } from '@mantine/core';
import { NOTIFICATIONS_CHANGED, api, type Paralysis, type User } from '../api/client';
import ParalysisFeed from '../components/ParalysisFeed';
import SummaryTab from '../components/SummaryTab';

// Remount (and refetch) when the patient or the report picked in the bell changes,
// so a report that arrived after the page loaded is in the list.
export default function PatientDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  return <PatientView key={`${id}-${params.get('report')}`} id={id!} />;
}

function PatientView({ id }: { id: string }) {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'summary';
  const highlightId = Number(params.get('report')) || null;

  const [patient, setPatient] = useState<User | null>(null);
  const [reports, setReports] = useState<Paralysis[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [markedSeen, setMarkedSeen] = useState(false);

  useEffect(() => {
    Promise.all([api<User>(`/patients/${id}`), api<Paralysis[]>(`/patients/${id}/paralysis`)])
      .then(([p, r]) => {
        setPatient(p);
        setReports(r);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  const unseen = reports?.filter((r) => !r.seen_by_therapist) ?? [];

  // Opening the log marks this patient's unseen reports as seen; the cards keep their "Nuevo" badge.
  useEffect(() => {
    const ids = reports?.filter((r) => !r.seen_by_therapist).map((r) => r.id) ?? [];
    if (tab !== 'paralysis' || markedSeen || ids.length === 0) return;
    Promise.all(ids.map((rid) => api(`/paralysis/${rid}/seen`, { method: 'PATCH' })))
      .then(() => {
        setMarkedSeen(true);
        window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
      })
      .catch(() => {
        // Best effort: the bell still shows them and the next visit retries.
      });
  }, [tab, markedSeen, reports]);

  function changeTab(value: string | null) {
    setParams(value && value !== 'summary' ? { tab: value } : {}, { replace: true });
  }

  return (
    <Container size="lg">
      <Anchor component={Link} to="/">
        ← Volver a pacientes
      </Anchor>
      {error && (
        <Alert color="red" mt="md">
          {error}
        </Alert>
      )}
      {!patient && !error && <Loader mt="md" />}
      {patient && reports && (
        <>
          <Title order={1} fz={32} my="lg">
            {patient.full_name}
          </Title>
          <Paper withBorder radius="lg" p="lg">
            <Tabs value={tab} onChange={changeTab}>
              <Tabs.List mb="lg">
                <Tabs.Tab value="summary" fz="lg">
                  Resumen
                </Tabs.Tab>
                <Tabs.Tab
                  value="paralysis"
                  fz="lg"
                  rightSection={
                    !markedSeen && unseen.length > 0 ? (
                      <Badge color="orange" circle>
                        {unseen.length}
                      </Badge>
                    ) : null
                  }
                >
                  Reportes de parálisis
                </Tabs.Tab>
                <Tabs.Tab value="tasks" fz="lg">
                  Tareas
                </Tabs.Tab>
                <Tabs.Tab value="tips" fz="lg">
                  Consejos
                </Tabs.Tab>
              </Tabs.List>
              {/* Tasks and tips arrive in phase 5. */}
              <Tabs.Panel value="summary">
                <SummaryTab patientId={id} />
              </Tabs.Panel>
              <Tabs.Panel value="paralysis">
                <ParalysisFeed reports={reports} highlightId={highlightId} />
              </Tabs.Panel>
              <Tabs.Panel value="tasks">
                <Text c="dimmed">Aquí podrás crear y editar tareas.</Text>
              </Tabs.Panel>
              <Tabs.Panel value="tips">
                <Text c="dimmed">Aquí podrás editar los consejos.</Text>
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </>
      )}
    </Container>
  );
}
