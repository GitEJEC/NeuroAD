import { EmptyState } from '../../src/components/EmptyState';
import { Screen } from '../../src/components/Screen';

// shortcut: placeholder until Fase 7 adds TaskCard + MicroStepList.
export default function Tasks() {
  return (
    <Screen>
      <EmptyState icon="format-list-checks" message="Aún no tienes tareas. Tu terapeuta las agregará pronto." />
    </Screen>
  );
}
