import { Link, Outlet } from 'react-router-dom';
import { Anchor, AppShell, Button, Group, Text } from '@mantine/core';
import { useAuth } from '../auth/AuthContext';
import NotificationBell from './NotificationBell';

export default function AppLayout() {
  const { user, logout } = useAuth();
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Anchor component={Link} to="/" fw={700} size="lg" underline="never">
            NeuroAD
          </Anchor>
          <Group gap="sm">
            <Text visibleFrom="xs">{user?.full_name}</Text>
            <NotificationBell />
            <Button variant="default" onClick={logout}>
              Salir
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
