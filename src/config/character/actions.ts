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
  spin: {
    durationMs: 800,
    vibrateMs: 15,
    moodOverride: 'excited',
    moodDurationMs: 900,
    bodyAnim: 'spin-once',
  },
}
