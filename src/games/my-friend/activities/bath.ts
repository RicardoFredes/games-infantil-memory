import { registerActivity } from './registry';

// Stub — implementação completa virá na Fase 2.
registerActivity({
  name: 'bath',
  kind: 'oneshot',
  durationMs: 4000,
  mood: 'happy',
  start: () => () => {},
});
