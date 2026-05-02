import type { ActionsConfig } from '@/games/character/types'

export const actions: ActionsConfig = {
  jump: {
    durationMs: 950,
    vibrateMs: 20,
    armTransform: {
      left:  { rotate: -8, translateX:  6 },
      right: { rotate:  8, translateX: -6 },
    },
    bodyAnim: 'jump-once',
  },
  wink: {
    durationMs: 600,
  },
  eyesClosed: {
    durationMs: 700,
  },
}
