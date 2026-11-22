import { StyleSheet, View } from 'react-native';
import { Surface, Text, TouchableRipple } from 'react-native-paper';
import type { Emotion } from '../api/client';
import { colors, spacing } from '../theme';

type Props = { emotions: Emotion[]; onPick: (emotion: Emotion) => void; disabled?: boolean };

// Two columns of big buttons: emoji + name (the emoji is never the only cue).
export function EmotionGrid({ emotions, onPick, disabled }: Props) {
  return (
    <View style={styles.grid}>
      {emotions.map((e) => (
        <Surface key={e.key} style={styles.cell} elevation={1}>
          <TouchableRipple
            onPress={() => onPick(e)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={e.label}
            style={styles.touch}
            borderless
          >
            <View style={styles.inner}>
              <Text style={styles.emoji}>
                {e.emoji}
              </Text>
              <Text variant="titleMedium">{e.label}</Text>
            </View>
          </TouchableRipple>
        </Surface>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
  cell: { width: '48%', borderRadius: 16, backgroundColor: colors.surface },
  touch: { borderRadius: 16, minHeight: 96, justifyContent: 'center' },
  inner: { alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  emoji: { fontSize: 36, lineHeight: 46 },
});
