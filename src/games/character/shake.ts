// Shake — body tilt rápido (±8°) ~400ms, repete 2x.
// Escreve em bodyShakeR; composer aplica a rotação no jump wrapper.

import { animate } from 'animejs'
import type { AnimState } from './transition'

type Anim = ReturnType<typeof animate>

export interface ShakeHandles {
  body: Anim | null
}

export function createShakeHandles(): ShakeHandles {
  return { body: null }
}

function cancel(h: Anim | null) {
  if (h) try { h.cancel() } catch { /* já cancelada */ }
}

export function stopShake(state: AnimState, h: ShakeHandles) {
  cancel(h.body); h.body = null
  state.bodyShakeR = 0
}

export interface ShakeConfig {
  durationMs: number
  amplitude: number
}

export function playShake(state: AnimState, h: ShakeHandles, cfg: ShakeConfig) {
  cancel(h.body)
  const total = cfg.durationMs
  const a = cfg.amplitude
  h.body = animate(state, {
    keyframes: [
      { bodyShakeR: 0,   duration: 0 },
      { bodyShakeR:  a,  duration: total * 0.10 },
      { bodyShakeR: -a,  duration: total * 0.15 },
      { bodyShakeR:  a,  duration: total * 0.15 },
      { bodyShakeR: -a,  duration: total * 0.15 },
      { bodyShakeR:  a * 0.6, duration: total * 0.15 },
      { bodyShakeR: -a * 0.4, duration: total * 0.15 },
      { bodyShakeR: 0,   duration: total * 0.15 },
    ],
    ease: 'inOutSine',
  })
}
