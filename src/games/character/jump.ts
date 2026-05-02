// Jump animation — replicado dos keyframes CSS originais aplicando os
// princípios clássicos: anticipation (squat antes de subir), squash &
// stretch (scaleY pra deformar o corpo no salto e impacto), follow-through
// (pés relaxando no ar e amortecendo no pouso).

import { animate } from 'animejs'
import type { JumpAction } from './types'
import type { AnimState } from './transition'

type Anim = ReturnType<typeof animate>

export interface JumpHandles {
  body: Anim | null
  legs: Anim | null
  feet: Anim | null
}

export function createJumpHandles(): JumpHandles {
  return { body: null, legs: null, feet: null }
}

function cancel(h: Anim | null) {
  if (h) try { h.cancel() } catch { /* já cancelada */ }
}

export function stopJump(state: AnimState, h: JumpHandles) {
  cancel(h.body); h.body = null
  cancel(h.legs); h.legs = null
  cancel(h.feet); h.feet = null
  state.bodyJumpY = 0
  state.bodyScaleY = 1
  state.legLeftJumpR = 0;  state.legRightJumpR = 0
  state.legLeftJumpY = 0;  state.legRightJumpY = 0
  state.footLeftJumpR = 0; state.footRightJumpR = 0
  state.footLeftJumpY = 0; state.footRightJumpY = 0
}

interface JumpKeyframes {
  body: Array<Record<string, number>>
  legs: Array<Record<string, number>>
  feet: Array<Record<string, number>>
}

function buildJumpKeyframes(total: number, peak: number, squat: number): JumpKeyframes {
  return {
    // Body: anticipation → lift → apex (hover) → impact → settle.
    // Squash 0.92 no agachamento, stretch 1.05 no voo, squash 0.94 no pouso.
    body: [
      { bodyJumpY: 0,           bodyScaleY: 1,    duration: 0 },
      { bodyJumpY: squat * 0.3, bodyScaleY: 0.98, duration: total * 0.08 },
      { bodyJumpY: squat,       bodyScaleY: 0.92, duration: total * 0.07 }, // deepest squat
      { bodyJumpY: -15,         bodyScaleY: 1.05, duration: total * 0.07 }, // lift-off stretch
      { bodyJumpY: peak * 0.88, bodyScaleY: 1.02, duration: total * 0.13 },
      { bodyJumpY: peak,        bodyScaleY: 1,    duration: total * 0.15 }, // apex hover
      { bodyJumpY: peak * 0.88, bodyScaleY: 1.02, duration: total * 0.15 },
      { bodyJumpY: -15,         bodyScaleY: 1.05, duration: total * 0.13 },
      { bodyJumpY: squat * 0.8, bodyScaleY: 0.94, duration: total * 0.07 }, // impact squash
      { bodyJumpY: squat * 0.3, bodyScaleY: 0.98, duration: total * 0.08 },
      { bodyJumpY: 0,           bodyScaleY: 1,    duration: total * 0.07 },
    ],
    // Pernas: agacham junto, retas no lift, leve abertura no apex, soft landing.
    legs: [
      { legLeftJumpR: 0, legRightJumpR: 0,  legLeftJumpY: 0, legRightJumpY: 0, duration: 0 },
      { legLeftJumpR: 6, legRightJumpR: -6, legLeftJumpY: 4, legRightJumpY: 4, duration: total * 0.12 },
      { legLeftJumpR: 0, legRightJumpR: 0,  legLeftJumpY: 0, legRightJumpY: 0, duration: total * 0.13 },
      { legLeftJumpR: 2, legRightJumpR: -2, legLeftJumpY: 0, legRightJumpY: 0, duration: total * 0.40 },
      { legLeftJumpR: 4, legRightJumpR: -4, legLeftJumpY: 2, legRightJumpY: 2, duration: total * 0.25 },
      { legLeftJumpR: 0, legRightJumpR: 0,  legLeftJumpY: 0, legRightJumpY: 0, duration: total * 0.10 },
    ],
    // Pés divergem das pernas no ar (pendem relaxados ↘ -12°).
    feet: [
      { footLeftJumpR: 0,   footRightJumpR: 0,   footLeftJumpY: 0, footRightJumpY: 0, duration: 0 },
      { footLeftJumpR: 6,   footRightJumpR: -6,  footLeftJumpY: 4, footRightJumpY: 4, duration: total * 0.12 },
      { footLeftJumpR: -12, footRightJumpR: 12,  footLeftJumpY: 0, footRightJumpY: 0, duration: total * 0.23 },
      { footLeftJumpR: -12, footRightJumpR: 12,  footLeftJumpY: 0, footRightJumpY: 0, duration: total * 0.30 },
      { footLeftJumpR: 4,   footRightJumpR: -4,  footLeftJumpY: 2, footRightJumpY: 2, duration: total * 0.25 },
      { footLeftJumpR: 0,   footRightJumpR: 0,   footLeftJumpY: 0, footRightJumpY: 0, duration: total * 0.10 },
    ],
  }
}

function applyJumpKeyframes(
  state: AnimState,
  h: JumpHandles,
  kf: JumpKeyframes,
  loop: boolean,
) {
  cancel(h.body); cancel(h.legs); cancel(h.feet)
  h.body = animate(state, { keyframes: kf.body, loop, ease: 'linear' })
  h.legs = animate(state, { keyframes: kf.legs, loop, ease: 'linear' })
  h.feet = animate(state, { keyframes: kf.feet, loop, ease: 'linear' })
}

/** One-shot jump (corpo + pernas + pés). */
export function playJump(state: AnimState, h: JumpHandles, cfg: JumpAction) {
  applyJumpKeyframes(state, h, buildJumpKeyframes(cfg.durationMs, cfg.peakY, cfg.squatY), false)
}

/** Body jump-loop em modo excited — mesma mecânica do one-shot, em loop. */
export function startBodyJumpLoop(state: AnimState, h: JumpHandles, peakY: number, squatY: number) {
  applyJumpKeyframes(state, h, buildJumpKeyframes(950, peakY, squatY), true)
}
