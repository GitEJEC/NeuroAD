import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

// Shared scrollable page body (keeps padding and background in one place).
export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, gap: spacing.lg, padding: spacing.lg },
});
