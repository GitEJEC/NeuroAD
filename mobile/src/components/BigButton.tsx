import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { MIN_TOUCH, PARALYSIS_HEIGHT } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  icon?: string;
  loading?: boolean;
  mode?: 'contained' | 'outlined' | 'text';
  // Tall = the main action of the screen (paralysis button: ≥ 120 dp).
  tall?: boolean;
  // For toggle buttons (task feedback): announced to screen readers.
  selected?: boolean;
  disabled?: boolean;
};

export function BigButton({ label, onPress, icon, loading, mode = 'contained', tall, selected, disabled }: Props) {
  return (
    <Button
      mode={mode}
      icon={icon}
      onPress={onPress}
      loading={loading}
      disabled={loading || disabled}
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      style={styles.button}
      contentStyle={{ minHeight: tall ? PARALYSIS_HEIGHT : MIN_TOUCH + 8 }}
      labelStyle={tall ? styles.tallLabel : undefined}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'stretch', borderRadius: 16 },
  tallLabel: { fontSize: 26, lineHeight: 34 },
});
