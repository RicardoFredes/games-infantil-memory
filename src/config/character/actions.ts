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
  wave: {
    durationMs: 1400,
  },
  shake: {
    durationMs: 600,
    amplitude: 8,
  },
  bounce: {
    durationMs: 900,
    peakY: -22,
  },
}
