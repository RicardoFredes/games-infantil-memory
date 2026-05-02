import type { ActionsConfig } from '@/games/character/types'

export const actions: ActionsConfig = {
  jump: {
    durationMs: 950,
    vibrateMs: 20,
    peakY: -50,
    squatY: 6,
  },
  wink: {
    durationMs: 600,
  },
  eyesClosed: {
    durationMs: 700,
  },
}
