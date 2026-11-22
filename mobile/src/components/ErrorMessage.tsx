import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { colors, spacing } from '../theme';
import { BigButton } from './BigButton';

export function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.box} accessibilityLiveRegion="polite">
      <View style={styles.row}>
        <Icon source="wifi-alert" size={28} color={colors.error} />
        <Text variant="bodyLarge" style={styles.text}>
          {message}
        </Text>
      </View>
      <BigButton label="Reintentar" icon="refresh" mode="outlined" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.md, padding: spacing.md, borderRadius: 16, backgroundColor: '#FCEEEE' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { flex: 1 },
});
