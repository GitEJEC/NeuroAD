import { Lexend_400Regular, Lexend_600SemiBold, Lexend_700Bold, useFonts } from '@expo-google-fonts/lexend';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SessionProvider, useSession } from '../src/api/session';
import { colors, theme } from '../src/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Lexend_400Regular, Lexend_600SemiBold, Lexend_700Bold });

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="dark" />
      <SessionProvider>{fontsLoaded || fontError ? <RootStack /> : <Loading />}</SessionProvider>
    </PaperProvider>
  );
}

function RootStack() {
  const { user, loading } = useSession();
  // Guards must not run before the stored session is read, or they would redirect to login.
  if (loading) return <Loading />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Cargando" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
