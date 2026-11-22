import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { colors, spacing } from '../theme';

export function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <View style={styles.box}>
      <Icon source={icon} size={48} color={colors.muted} />
      <Text variant="bodyLarge" style={styles.text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg },
  text: { color: colors.muted },
});
