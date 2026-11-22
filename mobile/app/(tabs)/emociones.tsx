import { EmptyState } from '../../src/components/EmptyState';
import { Screen } from '../../src/components/Screen';

// shortcut: placeholder until Fase 7 adds EmotionGrid.
export default function Emotions() {
  return (
    <Screen>
      <EmptyState icon="emoticon-outline" message="Pronto podrás registrar cómo te sientes." />
    </Screen>
  );
}
