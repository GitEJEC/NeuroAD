import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Snackbar, Text } from 'react-native-paper';
import { api, errorMessage, type Emotion, type IdOut } from '../../src/api/client';
import { BigButton } from '../../src/components/BigButton';
import { EmotionGrid } from '../../src/components/EmotionGrid';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Screen } from '../../src/components/Screen';
import { vibrate } from '../../src/haptics';
import { colors, spacing } from '../../src/theme';

type Logged = { id: number; label: string; at: Date };

// Phone's local time (the patient is in Santiago), so no Intl time zone support is needed.
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function Emotions() {
  const [emotions, setEmotions] = useState<Emotion[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Emotion | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  // shortcut: last log lives in memory only (no endpoint returns it), so it is empty after reopening the app.
  const [history, setHistory] = useState<Logged[]>([]);
  const [snackbar, setSnackbar] = useState(false);
  const last = history[history.length - 1] as Logged | undefined;

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setEmotions(await api<Emotion[]>('/emotions'));
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Tapping the selected emotion again clears the choice.
  function pick(emotion: Emotion) {
    setSelected((prev) => (prev?.key === emotion.key ? null : emotion));
  }

  // Nothing is saved until Enviar, so a stray tap on the grid never creates a log.
  async function send(emotion: Emotion) {
    setSaving(true);
    setError(null);
    try {
      const { id } = await api<IdOut>('/me/emotions', {
        method: 'POST',
        body: JSON.stringify({ emotion_key: emotion.key }),
      });
      vibrate();
      setHistory((prev) => [...prev, { id, label: emotion.label, at: new Date() }]);
      setSelected(null);
      setSnackbar(true);
    } catch (e) {
      setError({ message: errorMessage(e), retry: () => send(emotion) });
    } finally {
      setSaving(false);
    }
  }

  async function undo(logged: Logged) {
    setError(null);
    try {
      await api(`/me/emotions/${logged.id}`, { method: 'DELETE' });
      vibrate();
      setHistory((prev) => prev.filter((h) => h.id !== logged.id));
    } catch (e) {
      setError({ message: errorMessage(e), retry: () => undo(logged) });
    }
  }

  return (
    <View style={styles.flex}>
      {/* Inner wrapper: the snackbar sits at its bottom, just above the fixed Enviar bar. */}
      <View style={styles.flex}>
        <Screen>
          <Text variant="headlineSmall" accessibilityRole="header">
            ¿Cómo te sientes ahora?
          </Text>
          <Text variant="bodyLarge" style={styles.muted}>
            Elige una emoción y toca Enviar.
          </Text>
          {loadError && <ErrorMessage message={loadError} onRetry={load} />}
          {error && <ErrorMessage message={error.message} onRetry={error.retry} />}
          {!loadError && emotions === null && (
            <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Cargando" />
          )}
          {emotions && (
            <EmotionGrid emotions={emotions} selectedKey={selected?.key ?? null} onPick={pick} disabled={saving} />
          )}
          {last && (
            <Text variant="bodyMedium" style={styles.muted}>
              Último registro: {last.label}, {hhmm(last.at)}
            </Text>
          )}
        </Screen>
        <Snackbar
          visible={snackbar && !!last}
          onDismiss={() => setSnackbar(false)}
          duration={5000}
          action={last ? { label: 'Deshacer', onPress: () => undo(last) } : undefined}
        >
          {`Guardado: ${last?.label ?? ''}`}
        </Snackbar>
      </View>
      {/* Fixed outside the scroll so the main action is always visible. */}
      {emotions && (
        <View style={styles.footer}>
          <BigButton
            label="Enviar"
            icon="send"
            onPress={() => selected && send(selected)}
            loading={saving}
            disabled={!selected}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  muted: { color: colors.muted },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E1E3EC',
  },
});
