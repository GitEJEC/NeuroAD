import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Icon, Text, TouchableRipple } from 'react-native-paper';
import { errorMessage, type Feedback, type Task } from '../api/client';
import { colors, spacing } from '../theme';
import { BigButton } from './BigButton';
import { ErrorMessage } from './ErrorMessage';
import { MicroStepList } from './MicroStepList';

type Choice = 'like' | 'dislike';

type Props = {
  task: Task;
  open: boolean;
  onToggle: () => void;
  onFeedback: (value: Feedback) => Promise<void>;
};

export function TaskCard({ task, open, onToggle, onFeedback }: Props) {
  // Kept here (not in MicroStepList) so the checks survive closing and reopening the card.
  const [checked, setChecked] = useState<boolean[]>([]);
  const [tapped, setTapped] = useState<Choice | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(choice: Choice) {
    setTapped(choice);
    setSaving(true);
    setError(null);
    try {
      // Tapping the selected button again clears the feedback.
      await onFeedback(task.feedback === choice ? null : choice);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function toggleStep(i: number) {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  const feedbackButton = (choice: Choice, label: string) => {
    const selected = task.feedback === choice;
    return (
      <BigButton
        label={label}
        icon={selected ? 'check' : undefined}
        mode={selected ? 'contained' : 'outlined'}
        selected={selected}
        loading={saving && tapped === choice}
        onPress={() => choose(choice)}
      />
    );
  };

  return (
    <Card mode="outlined" style={styles.card}>
      <TouchableRipple
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.header}
        borderless
      >
        <View style={styles.headerRow}>
          <Text variant="titleMedium" style={styles.title}>
            {task.title}
          </Text>
          <Icon source={open ? 'chevron-up' : 'chevron-down'} size={28} color={colors.muted} />
        </View>
      </TouchableRipple>
      {open && (
        <Card.Content style={styles.content}>
          <MicroStepList steps={task.steps} checked={checked} onToggle={toggleStep} />
          <Text variant="bodyLarge">¿Te sirvió esta tarea?</Text>
          {error && tapped && <ErrorMessage message={error} onRetry={() => choose(tapped)} />}
          {feedbackButton('like', 'Me sirvió 👍')}
          {feedbackButton('dislike', 'No me sirvió 👎')}
        </Card.Content>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, backgroundColor: colors.surface },
  header: { borderRadius: 16, minHeight: 64, justifyContent: 'center', paddingHorizontal: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  title: { flex: 1 },
  content: { gap: spacing.md, paddingBottom: spacing.md },
});
