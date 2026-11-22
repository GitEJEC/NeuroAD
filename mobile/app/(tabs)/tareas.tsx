import { EmptyState } from '../../src/components/EmptyState';
import { Screen } from '../../src/components/Screen';

// shortcut: placeholder until Fase 7 adds TaskCard + MicroStepList.
export default function Tasks() {
  return (
    <Screen>
      <EmptyState icon="format-list-checks" message="Pronto verás aquí las tareas que te dejó tu terapeuta." />
    </Screen>
  );
}
