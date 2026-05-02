// Importa todas as activities para que se auto-registrem.
// As atividades reais são adicionadas na Fase 2.

export { registerActivity, getActivity, listActivities } from './registry';
export type { ActivityName, ActivitySpec, ActivityKind } from './types';
