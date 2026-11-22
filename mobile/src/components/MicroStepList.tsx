import { StyleSheet, View } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { colors } from '../theme';

type Props = { steps: string[]; checked: boolean[]; onToggle: (index: number) => void };

// Checks live only in memory: they give a sense of progress and are never sent to the backend.
export function MicroStepList({ steps, checked, onToggle }: Props) {
  return (
    <View>
      {steps.map((step, i) => (
        <Checkbox.Item
          key={i}
          label={`${i + 1}. ${step}`}
          status={checked[i] ? 'checked' : 'unchecked'}
          onPress={() => onToggle(i)}
          position="leading"
          mode="android"
          color={colors.primary}
          labelVariant="bodyLarge"
          labelStyle={[styles.label, checked[i] && styles.done]}
          style={styles.item}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { paddingHorizontal: 0, minHeight: 48, alignItems: 'flex-start' },
  label: { textAlign: 'left' },
  done: { color: colors.muted },
});
