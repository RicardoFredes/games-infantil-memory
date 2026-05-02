// Bounce — sequência de 3 mini-saltos suaves. Reusa o mesmo bodyJumpY/bodyScaleY
// do jump, mas com amplitude reduzida e sem squat agressivo.

import { animate } from 'animejs'
import type { AnimState } from './transition'

type Anim = ReturnType<typeof animate>

export interface BounceHandles {
  body: Anim | null
}

export function createBounceHandles(): BounceHandles {
  return { body: null }
}

function cancel(h: Anim | null) {
  if (h) try { h.cancel() } catch { /* já cancelada */ }
}

export function stopBounce(state: AnimState, h: BounceHandles) {
  cancel(h.body); h.body = null
  state.bodyJumpY = 0
  state.bodyScaleY = 1
}

export interface BounceConfig {
  durationMs: number
  peakY: number
}

export function playBounce(state: AnimState, h: BounceHandles, cfg: BounceConfig) {
  cancel(h.body)
  const total = cfg.durationMs
  const peak = cfg.peakY
  // 3 hops curtos, cada um com squat suave + sub + apex + landing.
  const hop = total / 3
  const kf: Array<Record<string, number>> = []
  kf.push({ bodyJumpY: 0, bodyScaleY: 1, duration: 0 })
  for (let i = 0; i < 3; i++) {
    kf.push({ bodyJumpY: 4,         bodyScaleY: 0.96, duration: hop * 0.12 })
    kf.push({ bodyJumpY: peak,      bodyScaleY: 1.02, duration: hop * 0.30 })
    kf.push({ bodyJumpY: peak * 0.5, bodyScaleY: 1.00, duration: hop * 0.20 })
    kf.push({ bodyJumpY: 4,         bodyScaleY: 0.96, duration: hop * 0.18 })
    kf.push({ bodyJumpY: 0,         bodyScaleY: 1,    duration: hop * 0.20 })
  }
  h.body = animate(state, { keyframes: kf, ease: 'inOutSine' })
}
