import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text, TextInput } from 'react-native-paper';
import { api, errorMessage, type IdOut } from '../../src/api/client';
import { useSession } from '../../src/api/session';
import { BigButton } from '../../src/components/BigButton';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Screen } from '../../src/components/Screen';
import { colors, spacing } from '../../src/theme';

export default function Home() {
  const { user, logout } = useSession();
  const [sending, setSending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  // Set once the press is saved: opens the optional description panel.
  const [reportId, setReportId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const firstName = user?.full_name.split(' ')[0] ?? '';

  async function report() {
    setSending(true);
    setReportError(null);
    try {
      // Sent right away: the time of the press is recorded even if nothing is written.
      const { id } = await api<IdOut>('/me/paralysis', { method: 'POST' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setReportId(id);
    } catch (e) {
      setReportError(errorMessage(e));
    } finally {
      setSending(false);
    }
  }

  // The report is already saved; closing only hides the panel and stays on Inicio.
  function close() {
    setReportId(null);
    setDescription('');
    setSaveError(null);
  }

  function finish() {
    close();
    router.navigate('/que-hacer');
  }

  async function sendDescription() {
    if (!description.trim()) return finish();
    setSaving(true);
    setSaveError(null);
    try {
      await api(`/me/paralysis/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: description.trim() }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      finish();
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Text variant="headlineSmall" accessibilityRole="header">
        Hola, {firstName}
      </Text>
      <Text variant="bodyLarge" style={styles.muted}>
        Si te sientes bloqueado, toca el botón. Tu terapeuta recibirá un aviso.
      </Text>

      <BigButton label="Reportar parálisis" icon="hand-back-left" tall onPress={report} loading={sending} />
      {reportError && <ErrorMessage message={reportError} onRetry={report} />}

      <View style={styles.spacer} />
      <Button mode="text" icon="logout" onPress={logout} textColor={colors.muted} contentStyle={styles.logout}>
        Salir
      </Button>

      <Portal>
        <Modal visible={reportId !== null} dismissable={false} contentContainerStyle={styles.modal}>
          <KeyboardAvoidingView behavior="padding" style={styles.modalBody}>
            <Text variant="titleMedium" accessibilityLiveRegion="polite" style={styles.done}>
              Listo, tu terapeuta ya fue avisado.
            </Text>
            <TextInput
              mode="outlined"
              label="¿Qué pasó? (opcional)"
              placeholder="Escribe qué pasó"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
            {saveError && <ErrorMessage message={saveError} onRetry={sendDescription} />}
            <BigButton label="Enviar" icon="send" onPress={sendDescription} loading={saving} />
            <BigButton label="Salir" icon="close" mode="outlined" onPress={close} />
          </KeyboardAvoidingView>
        </Modal>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  spacer: { flex: 1 },
  logout: { minHeight: 48 },
  modal: { margin: spacing.md, padding: spacing.lg, borderRadius: 16, backgroundColor: colors.surface },
  modalBody: { gap: spacing.md },
  done: { color: colors.success },
});
