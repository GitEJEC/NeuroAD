import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionIcon, Indicator, Menu, Text } from '@mantine/core';
import { notifications as toasts } from '@mantine/notifications';
import { api, formatDateTime, type Notification } from '../api/client';

const POLL_MS = 15_000;

export default function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const knownIds = useRef<Set<number> | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const data = await api<Notification[]>('/notifications');
        // First load only sets the baseline; later polls toast reports not seen before.
        if (knownIds.current) {
          for (const n of data.filter((n) => !knownIds.current!.has(n.id))) {
            toasts.show({
              title: `Parálisis: ${n.patient_name}`,
              message: `${formatDateTime(n.pressed_at)} · ${n.description ?? 'Sin descripción'}`,
              autoClose: 10_000,
            });
          }
        }
        knownIds.current = new Set(data.map((n) => n.id));
        setItems(data);
      } catch {
        // Network hiccup: keep the last list and retry on the next tick.
      }
    }
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  async function open(n: Notification) {
    try {
      await api(`/paralysis/${n.id}/seen`, { method: 'PATCH' });
      setItems((prev) => prev.filter((x) => x.id !== n.id));
    } catch {
      // Marking as seen is best effort; still take the therapist to the patient.
    }
    navigate(`/patients/${n.patient_id}`);
  }

  return (
    <Menu position="bottom-end" width={340} shadow="md">
      <Menu.Target>
        <Indicator label={items.length} size={18} disabled={items.length === 0} color="red">
          <ActionIcon variant="subtle" size="lg" aria-label={`Notificaciones: ${items.length} sin ver`}>
            <span aria-hidden="true" style={{ fontSize: 20 }}>🔔</span>
          </ActionIcon>
        </Indicator>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Parálisis sin ver</Menu.Label>
        {items.length === 0 && (
          <Text size="sm" c="dimmed" p="sm">
            No hay reportes nuevos.
          </Text>
        )}
        {items.map((n) => (
          <Menu.Item key={n.id} onClick={() => open(n)}>
            <Text size="sm" fw={500}>
              {n.patient_name}
            </Text>
            <Text size="xs" c="dimmed">
              {formatDateTime(n.pressed_at)}
            </Text>
            {n.description && (
              <Text size="xs" lineClamp={2}>
                {n.description}
              </Text>
            )}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
