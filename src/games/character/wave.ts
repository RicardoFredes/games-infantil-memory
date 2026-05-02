// Wave — braço direito sobe até a cabeça e oscila lateralmente.
// Usa offsets dedicados (armRightWaveR/Y) para não brigar com sway/bob do mood.

import { animate } from 'animejs'
import type { AnimState } from './transition'

type Anim = ReturnType<typeof animate>

export interface WaveHandles {
  arm: Anim | null
}

export function createWaveHandles(): WaveHandles {
  return { arm: null }
}

function cancel(h: Anim | null) {
  if (h) try { h.cancel() } catch { /* já cancelada */ }
}

export function stopWave(state: AnimState, h: WaveHandles) {
  cancel(h.arm); h.arm = null
  state.armRightWaveR = 0
  state.armRightWaveY = 0
}

export interface WaveConfig {
  durationMs: number
}

export function playWave(state: AnimState, h: WaveHandles, cfg: WaveConfig) {
  cancel(h.arm)
  const total = cfg.durationMs
  // Sobe (rotaciona -85° + sobe 25px), oscila ±20°, desce.
  h.arm = animate(state, {
    keyframes: [
      { armRightWaveR: 0,    armRightWaveY: 0,   duration: 0 },
      { armRightWaveR: -85,  armRightWaveY: -25, duration: total * 0.18 },
      { armRightWaveR: -65,  armRightWaveY: -25, duration: total * 0.16 },
      { armRightWaveR: -105, armRightWaveY: -25, duration: total * 0.16 },
      { armRightWaveR: -65,  armRightWaveY: -25, duration: total * 0.16 },
      { armRightWaveR: -90,  armRightWaveY: -25, duration: total * 0.10 },
      { armRightWaveR: 0,    armRightWaveY: 0,   duration: total * 0.24 },
    ],
    ease: 'inOutSine',
  })
}
