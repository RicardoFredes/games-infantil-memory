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

/** One-shot jump (corpo + pernas + pés). Duração base 950ms. */
export function playJump(state: AnimState, h: JumpHandles, cfg: JumpAction) {
  cancel(h.body); cancel(h.legs); cancel(h.feet)

  const total = cfg.durationMs

  // ─── BODY: anticipation → lift → apex → impact → settle ───
  // Os duration de cada keyframe somam total.
  // Antecipação: agacha (Y +6, scaleY 0.92) antes de explodir pra cima.
  // Stretch no lift-off (scaleY 1.05). Apex hover. Squash no impacto.
  h.body = animate(state, {
    keyframes: [
      { bodyJumpY: 0,   bodyScaleY: 1,    duration: 0 },
      { bodyJumpY: 2,   bodyScaleY: 0.98, duration: total * 0.08 },
      { bodyJumpY: 6,   bodyScaleY: 0.92, duration: total * 0.07 },  // deepest squat
      { bodyJumpY: -15, bodyScaleY: 1.05, duration: total * 0.07 },  // lift-off, stretch
      { bodyJumpY: -44, bodyScaleY: 1.02, duration: total * 0.13 },
      { bodyJumpY: -50, bodyScaleY: 1,    duration: total * 0.15 },  // apex (hover)
      { bodyJumpY: -44, bodyScaleY: 1.02, duration: total * 0.15 },
      { bodyJumpY: -15, bodyScaleY: 1.05, duration: total * 0.13 },
      { bodyJumpY: 5,   bodyScaleY: 0.94, duration: total * 0.07 },  // impact squash
      { bodyJumpY: 2,   bodyScaleY: 0.98, duration: total * 0.08 },
      { bodyJumpY: 0,   bodyScaleY: 1,    duration: total * 0.07 },
    ],
    ease: 'linear',
  })

  // ─── LEGS: agachamento → reta no lift → leve abertura no apex → soft landing
  h.legs = animate(state, {
    keyframes: [
      { legLeftJumpR: 0, legRightJumpR: 0,  legLeftJumpY: 0, legRightJumpY: 0, duration: 0 },
      { legLeftJumpR: 6, legRightJumpR: -6, legLeftJumpY: 4, legRightJumpY: 4, duration: total * 0.12 },
      { legLeftJumpR: 0, legRightJumpR: 0,  legLeftJumpY: 0, legRightJumpY: 0, duration: total * 0.13 }, // lift-off
      { legLeftJumpR: 2, legRightJumpR: -2, legLeftJumpY: 0, legRightJumpY: 0, duration: total * 0.40 }, // mid-air slight
      { legLeftJumpR: 4, legRightJumpR: -4, legLeftJumpY: 2, legRightJumpY: 2, duration: total * 0.25 }, // landing soft
      { legLeftJumpR: 0, legRightJumpR: 0,  legLeftJumpY: 0, legRightJumpY: 0, duration: total * 0.10 },
    ],
    ease: 'linear',
  })

  // ─── FEET: divergem das pernas no ar (pendem relaxados ↘ -12°)
  h.feet = animate(state, {
    keyframes: [
      { footLeftJumpR: 0,   footRightJumpR: 0,   footLeftJumpY: 0, footRightJumpY: 0, duration: 0 },
      { footLeftJumpR: 6,   footRightJumpR: -6,  footLeftJumpY: 4, footRightJumpY: 4, duration: total * 0.12 }, // squat
      { footLeftJumpR: -12, footRightJumpR: 12,  footLeftJumpY: 0, footRightJumpY: 0, duration: total * 0.23 }, // air relax
      { footLeftJumpR: -12, footRightJumpR: 12,  footLeftJumpY: 0, footRightJumpY: 0, duration: total * 0.30 }, // hold
      { footLeftJumpR: 4,   footRightJumpR: -4,  footLeftJumpY: 2, footRightJumpY: 2, duration: total * 0.25 }, // landing
      { footLeftJumpR: 0,   footRightJumpR: 0,   footLeftJumpY: 0, footRightJumpY: 0, duration: total * 0.10 },
    ],
    ease: 'linear',
  })
}

/** Body jump-loop em modo excited (mesma curva do one-shot, em loop). */
export function startBodyJumpLoop(state: AnimState, h: JumpHandles, peakY: number, squatY: number) {
  cancel(h.body); cancel(h.legs); cancel(h.feet)
  h.body = animate(state, {
    keyframes: [
      { bodyJumpY: 0,        bodyScaleY: 1,    duration: 0 },
      { bodyJumpY: squatY,   bodyScaleY: 0.92, duration: 150 },
      { bodyJumpY: peakY,    bodyScaleY: 1.05, duration: 250 },
      { bodyJumpY: peakY,    bodyScaleY: 1,    duration: 150 },
      { bodyJumpY: squatY*0.8, bodyScaleY: 0.94, duration: 200 },
      { bodyJumpY: 0,        bodyScaleY: 1,    duration: 200 },
    ],
    loop: true,
    ease: 'linear',
  })
}
