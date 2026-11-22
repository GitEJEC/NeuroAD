import { Box, Group, Stack, Text } from '@mantine/core';
import type { Emotion } from '../api/client';

type Props = {
  emotions: Emotion[];
  counts: Record<string, number>;
};

// All catalog emotions, so the legend keeps its shape across ranges; zeros are dimmed.
export default function EmotionLegend({ emotions, counts }: Props) {
  const sorted = [...emotions].sort((a, b) => (counts[b.key] ?? 0) - (counts[a.key] ?? 0));
  return (
    <Stack gap="xs" component="ul" p={0} m={0} style={{ listStyle: 'none' }}>
      {sorted.map((e) => {
        const n = counts[e.key] ?? 0;
        return (
          <Group key={e.key} component="li" justify="space-between" wrap="nowrap" c={n ? undefined : 'dimmed'}>
            <Group gap="sm" wrap="nowrap">
              <Box w={18} h={18} bg={e.color} style={{ borderRadius: 4, flexShrink: 0 }} />
              <Text>
                {e.emoji} {e.label}
              </Text>
            </Group>
            <Text fw={600}>{n}</Text>
          </Group>
        );
      })}
    </Stack>
  );
}
