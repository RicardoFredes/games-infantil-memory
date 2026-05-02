import { registerActivity } from './registry';

// Stub — implementação completa virá na Fase 2.
registerActivity({
  name: 'gift',
  kind: 'oneshot',
  durationMs: 3000,
  mood: 'excited',
  start: () => () => {},
});
