import { vibrate } from '../../src/haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { api, errorMessage, type Feedback, type Task } from '../../src/api/client';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Screen } from '../../src/components/Screen';
import { TaskCard } from '../../src/components/TaskCard';
import { colors } from '../../src/theme';

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Accordion: only one task open at a time.
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTasks(await api<Task[]>('/me/tasks'));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  // Reload on every visit, so the therapist's edits show up without restarting the app.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function sendFeedback(taskId: number, value: Feedback) {
    const updated = await api<Task>(`/me/tasks/${taskId}/feedback`, { method: 'PUT', body: JSON.stringify({ value }) });
    vibrate();
    setTasks((prev) => prev?.map((t) => (t.id === taskId ? updated : t)) ?? null);
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[colors.primary]} />}>
      <Text variant="bodyLarge" style={styles.muted}>
        Toca una tarea para ver sus pasos. Marca cada paso cuando lo hagas.
      </Text>
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!error && tasks === null && <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Cargando" />}
      {tasks?.length === 0 && (
        <EmptyState icon="format-list-checks" message="Aún no tienes tareas. Tu terapeuta las agregará pronto." />
      )}
      {tasks?.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          open={openId === task.id}
          onToggle={() => setOpenId(openId === task.id ? null : task.id)}
          onFeedback={(value) => sendFeedback(task.id, value)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
});
