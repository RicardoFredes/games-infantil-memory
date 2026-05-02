import { registerActivity } from './registry';

// Stub — implementação completa virá na Fase 2.
registerActivity({
  name: 'eat',
  kind: 'oneshot',
  durationMs: 2500,
  mood: 'happy',
  start: () => () => {},
});
