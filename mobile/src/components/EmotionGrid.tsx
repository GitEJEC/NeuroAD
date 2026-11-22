import { StyleSheet, View } from 'react-native';
import { Icon, Surface, Text, TouchableRipple } from 'react-native-paper';
import type { Emotion } from '../api/client';
import { colors, spacing } from '../theme';

type Props = {
  emotions: Emotion[];
  selectedKey: string | null;
  onPick: (emotion: Emotion) => void;
  disabled?: boolean;
};

// Two columns of big buttons: emoji + name (the emoji is never the only cue).
// Picking only selects; the screen's Enviar button saves it.
export function EmotionGrid({ emotions, selectedKey, onPick, disabled }: Props) {
  return (
    <View style={styles.grid}>
      {emotions.map((e) => {
        const selected = e.key === selectedKey;
        return (
          <Surface key={e.key} style={[styles.cell, selected && styles.selected]} elevation={1}>
            <TouchableRipple
              onPress={() => onPick(e)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={e.label}
              accessibilityState={{ selected, disabled }}
              style={styles.touch}
              borderless
            >
              <View style={styles.inner}>
                <Text style={styles.emoji}>{e.emoji}</Text>
                <Text variant="titleMedium">{e.label}</Text>
              </View>
            </TouchableRipple>
            {selected && (
              <View style={styles.check} pointerEvents="none">
                <Icon source="check-circle" size={28} color={colors.primary} />
              </View>
            )}
          </Surface>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
  // Border always 3 px (transparent when not selected) so selecting does not shift the layout.
  cell: { width: '48%', borderRadius: 16, borderWidth: 3, borderColor: 'transparent', backgroundColor: colors.surface },
  selected: { borderColor: colors.primary },
  touch: { borderRadius: 13, minHeight: 96, justifyContent: 'center' },
  inner: { alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  emoji: { fontSize: 36, lineHeight: 46 },
  check: { position: 'absolute', top: spacing.xs, right: spacing.xs },
});
