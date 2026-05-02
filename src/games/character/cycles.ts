// Loops contínuos por modo. Cada cycle escreve em campos do AnimState
// via anime.js. setMood reinicia os cycles relevantes ao novo modo.

import { animate } from 'animejs'
import type { CycleConfig } from './types'
import type { AnimState } from './transition'

type Anim = ReturnType<typeof animate>

export interface CycleHandles {
  breathing: Anim | null
  blink:     Anim | null
  armSway:   Anim | null
  armBob:    Anim | null
  pupil:     Anim | null
  mouthGrin: Anim | null
  thinking:  Anim | null
}

export function createCycleHandles(): CycleHandles {
  return { breathing: null, blink: null, armSway: null, armBob: null, pupil: null, mouthGrin: null, thinking: null }
}

function cancel(h: Anim | null) {
  if (h) try { h.cancel() } catch { /* já cancelada */ }
}

export function startBreathing(state: AnimState, h: CycleHandles) {
  cancel(h.breathing)
  h.breathing = animate(state, {
    bodyBreatheY: [{ to: -3 }, { to: 0 }],
    duration: 4000,
    loop: true,
    ease: 'inOutSine',
  })
}

export function startBlink(state: AnimState, h: CycleHandles) {
  cancel(h.blink)
  h.blink = animate(state, {
    keyframes: [
      { eyeLeftBlinkY: 1,   eyeRightBlinkY: 1,   duration: 3720 },
      { eyeLeftBlinkY: 0.1, eyeRightBlinkY: 0.1, duration: 120  },
      { eyeLeftBlinkY: 1,   eyeRightBlinkY: 1,   duration: 160  },
    ],
    loop: true,
    ease: 'inOutQuad',
  })
}

export function applyModeCycles(state: AnimState, h: CycleHandles, cfg: CycleConfig) {
  cancel(h.armSway);   h.armSway   = null
  cancel(h.armBob);    h.armBob    = null
  cancel(h.pupil);     h.pupil     = null
  cancel(h.mouthGrin); h.mouthGrin = null
  cancel(h.thinking);  h.thinking  = null

  if (cfg.armSway) {
    const a = cfg.armSway.amplitude
    h.armSway = animate(state, {
      armLeftSwayR:  [{ to: 0 }, { to:  a }, { to: 0 }, { to: -a }, { to: 0 }],
      armRightSwayR: [{ to: 0 }, { to: -a }, { to: 0 }, { to:  a }, { to: 0 }],
      duration: cfg.armSway.durationMs,
      loop: true,
      ease: 'inOutSine',
    })
  } else {
    state.armLeftSwayR = 0
    state.armRightSwayR = 0
  }

  if (cfg.armBob) {
    const a = cfg.armBob.amplitude
    h.armBob = animate(state, {
      armLeftBobY:  [{ to: 0 }, { to: -a }, { to: 0 }],
      armRightBobY: [{ to: 0 }, { to: -a }, { to: 0 }],
      duration: cfg.armBob.durationMs,
      loop: true,
      ease: 'inOutSine',
    })
  } else {
    state.armLeftBobY = 0
    state.armRightBobY = 0
  }

  if (cfg.pupilSparkle) {
    h.pupil = animate(state, {
      pupilSparkle: [{ to: 1 }, { to: 0.3 }, { to: 0.2 }, { to: 1 }],
      duration: cfg.pupilSparkle.durationMs,
      loop: true,
      ease: 'inOutSine',
    })
  } else {
    state.pupilSparkle = 1
  }

  if (cfg.mouthGrin) {
    h.mouthGrin = animate(state, {
      mouthGrinScale: [{ to: 1 }, { to: 1.06 }, { to: 1 }],
      duration: cfg.mouthGrin.durationMs,
      loop: true,
      ease: 'inOutSine',
    })
  } else {
    state.mouthGrinScale = 1
  }

  // Thinking: braço/mão direita "voam" pra junto da cabeça (entrada 700ms)
  // e depois ficam coçando suavemente (-4° ↔ 0° em loop).
  if (cfg.thinking) {
    state.armRightSwayR = 40
    state.armRightBobY  = 20
    h.thinking = animate(state, {
      armRightSwayR: 0,
      armRightBobY:  0,
      duration: 700,
      ease: 'inOutSine',
      onComplete: () => {
        h.thinking = animate(state, {
          armRightSwayR: [{ to: 0 }, { to: -4 }, { to: 0 }],
          duration: cfg.thinking!.durationMs,
          loop: true,
          ease: 'inOutSine',
        })
      },
    })
  }
}
