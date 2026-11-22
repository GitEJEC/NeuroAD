import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '../src/api/client';
import { useSession } from '../src/api/session';
import { BigButton } from '../src/components/BigButton';
import { Screen } from '../src/components/Screen';
import { colors, spacing } from '../src/theme';

export default function Login() {
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setError(null);
    setSending(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(errorMessage(e));
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <View style={styles.header}>
          <Text variant="headlineSmall" accessibilityRole="header">
            NeuroAD
          </Text>
          <Text variant="bodyLarge" style={styles.muted}>
            Entra con el correo y la contraseña que te dio tu terapeuta.
          </Text>
        </View>
        <TextInput
          mode="outlined"
          label="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          mode="outlined"
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={submit}
        />
        {error && (
          <HelperText type="error" visible style={styles.error}>
            {error}
          </HelperText>
        )}
        <BigButton label="Entrar" icon="login" onPress={submit} loading={sending} />
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { gap: spacing.sm, marginTop: spacing.xl },
  muted: { color: colors.muted },
  error: { fontSize: 18, lineHeight: 27 },
});
