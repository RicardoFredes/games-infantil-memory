import { registerActivity } from './registry';

// Stub — implementação completa virá na Fase 2.
registerActivity({
  name: 'sleep',
  kind: 'toggle',
  durationMs: 8000,
  mood: 'sleeping',
  start: () => () => {},
});
