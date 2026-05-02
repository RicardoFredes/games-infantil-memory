import { animate } from 'animejs'
import type { JumpAction } from './types'
import type { AnimState } from './transition'

type Anim = ReturnType<typeof animate>

export interface JumpHandles {
  bodyAnim: Anim | null
  legAnim:  Anim | null
}

export function createJumpHandles(): JumpHandles {
  return { bodyAnim: null, legAnim: null }
}

function cancel(h: Anim | null) {
  if (h) try { h.cancel() } catch { /* já cancelada */ }
}

export function stopJump(state: AnimState, h: JumpHandles) {
  cancel(h.bodyAnim); h.bodyAnim = null
  cancel(h.legAnim);  h.legAnim  = null
  state.bodyJumpY = 0
  state.legLeftJumpR = 0
  state.legRightJumpR = 0
  state.legLeftJumpY = 0
  state.legRightJumpY = 0
}

/** One-shot jump: agacha → sobe → topo → desce → impacto. */
export function playJump(state: AnimState, h: JumpHandles, cfg: JumpAction) {
  cancel(h.bodyAnim)
  cancel(h.legAnim)

  const total = cfg.durationMs
  const peak = cfg.peakY
  const squat = cfg.squatY

  h.bodyAnim = animate(state, {
    keyframes: [
      { bodyJumpY: 0,           duration: 0 },
      { bodyJumpY: squat,       duration: total * 0.15 },
      { bodyJumpY: peak,        duration: total * 0.35 },
      { bodyJumpY: peak,        duration: total * 0.15 },
      { bodyJumpY: squat * 0.8, duration: total * 0.20 },
      { bodyJumpY: 0,           duration: total * 0.15 },
    ],
    ease: 'linear',
  })

  h.legAnim = animate(state, {
    keyframes: [
      { legLeftJumpR: 0, legRightJumpR: 0,  legLeftJumpY: 0, legRightJumpY: 0, duration: 0 },
      { legLeftJumpR: 6, legRightJumpR: -6, legLeftJumpY: 4, legRightJumpY: 4, duration: total * 0.12 },
      { legLeftJumpR: 0, legRightJumpR: 0,  legLeftJumpY: 0, legRightJumpY: 0, duration: total * 0.13 },
      { legLeftJumpR: 2, legRightJumpR: -2, legLeftJumpY: 0, legRightJumpY: 0, duration: total * 0.45 },
      { legLeftJumpR: 4, legRightJumpR: -4, legLeftJumpY: 2, legRightJumpY: 2, duration: total * 0.20 },
      { legLeftJumpR: 0, legRightJumpR: 0,  legLeftJumpY: 0, legRightJumpY: 0, duration: total * 0.10 },
    ],
    ease: 'linear',
  })
}

/** Body jump-loop em modo excited. */
export function startBodyJumpLoop(state: AnimState, h: JumpHandles, peakY: number, squatY: number) {
  cancel(h.bodyAnim)
  h.bodyAnim = animate(state, {
    keyframes: [
      { bodyJumpY: 0      },
      { bodyJumpY: squatY },
      { bodyJumpY: peakY  },
      { bodyJumpY: peakY  },
      { bodyJumpY: 0      },
    ],
    duration: 950,
    loop: true,
    ease: 'inOutQuad',
  })
}
