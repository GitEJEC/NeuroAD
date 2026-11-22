import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { spacing } from '../theme';

export function TipCard({ title, body }: { title: string; body: string }) {
  return (
    <Card mode="outlined" style={styles.card}>
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" accessibilityRole="header">
          {title}
        </Text>
        <Text variant="bodyLarge">{body}</Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16 },
  content: { gap: spacing.sm, paddingVertical: spacing.md },
});
