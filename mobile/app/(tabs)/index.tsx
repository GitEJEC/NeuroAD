import { vibrate } from '../../src/haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Snackbar, Text, TextInput } from 'react-native-paper';
import { api, errorMessage, type IdOut } from '../../src/api/client';
import { useSession } from '../../src/api/session';
import { BigButton } from '../../src/components/BigButton';
import { ErrorMessage } from '../../src/components/ErrorMessage';
import { Screen } from '../../src/components/Screen';
import { colors, spacing } from '../../src/theme';

export default function Home() {
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  // Set once the POST succeeds, so retrying after a failed PATCH does not create a second report.
  const [reportId, setReportId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const firstName = user?.full_name.split(' ')[0] ?? '';

  function openPanel() {
    vibrate();
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setDescription('');
    setReportId(null);
    setSaveError(null);
  }

  // The report is created only here: nothing reaches the therapist until the patient taps Enviar.
  async function send() {
    setSaving(true);
    setSaveError(null);
    try {
      const id = reportId ?? (await api<IdOut>('/me/paralysis', { method: 'POST' })).id;
      setReportId(id);
      const text = description.trim();
      if (text) {
        await api(`/me/paralysis/${id}`, { method: 'PATCH', body: JSON.stringify({ description: text }) });
      }
      vibrate();
      close();
      setSent(true);
      router.navigate('/que-hacer');
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
        Si te sientes bloqueado, toca el botón. Luego toca Enviar para avisar a tu terapeuta.
      </Text>

      <BigButton label="Reportar parálisis" icon="hand-back-left" tall onPress={openPanel} />

      <View style={styles.spacer} />
      <Button mode="text" icon="logout" onPress={logout} textColor={colors.muted} contentStyle={styles.logout}>
        Salir
      </Button>

      <Portal>
        {/* Anchored to the top so the keyboard never covers Enviar / Salir. */}
        <Modal visible={open} dismissable={false} style={styles.modalWrapper} contentContainerStyle={styles.modal}>
          <View style={styles.modalBody}>
            <Text variant="titleMedium" accessibilityRole="header">
              Avisa a tu terapeuta
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
            {saveError && <ErrorMessage message={saveError} onRetry={send} />}
            <BigButton label="Enviar" icon="send" onPress={send} loading={saving} />
            <BigButton label="Salir" icon="close" mode="outlined" onPress={close} />
          </View>
        </Modal>
        {/* Lives in the Portal so it stays visible after switching to Qué hacer. */}
        <Snackbar visible={sent} onDismiss={() => setSent(false)} duration={4000} wrapperStyle={styles.snackbar}>
          Listo, tu terapeuta ya fue avisado.
        </Snackbar>
      </Portal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.muted },
  spacer: { flex: 1 },
  logout: { minHeight: 48 },
  modalWrapper: { justifyContent: 'flex-start' },
  modal: { margin: spacing.md, marginTop: 192, padding: spacing.lg, borderRadius: 16, backgroundColor: colors.surface },
  modalBody: { gap: spacing.md },
  snackbar: { bottom: 72 },
});
