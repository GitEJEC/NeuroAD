import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { api, errorMessage, type Tip } from '../../src/api/client';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Screen } from '../../src/components/Screen';
import { TipCard } from '../../src/components/TipCard';
import { colors } from '../../src/theme';

export default function WhatToDo() {
  const [tips, setTips] = useState<Tip[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setTips(await api<Tip[]>('/me/tips'));
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

  return (
    <Screen>
      <Text variant="bodyLarge" style={styles.muted}>
        Prueba una de estas ideas. Elige la que te parezca más fácil.
      </Text>
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!error && tips === null && <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Cargando" />}
      {tips?.length === 0 && (
        <EmptyState icon="lightbulb-outline" message="Aún no tienes consejos. Tu terapeuta los agregará pronto." />
      )}
      {tips?.map((tip) => <TipCard key={tip.id} title={tip.title} body={tip.body} />)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
});
