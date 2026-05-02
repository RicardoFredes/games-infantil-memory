// Transição entre modos: anima a "base" do AnimState (campos do mood)
// para o novo target via anime.js. Cada parte mantém um handle pra ser
// cancelado quando um novo setMood acontece.

import { animate } from 'animejs'
import type { ModeConfig, Transform2D } from './types'

type Anim = ReturnType<typeof animate>

export interface AnimState {
  // ─── Base (interpolada por setMood transitions) ────────────
  armLeft:      Required<Transform2D>
  armRight:     Required<Transform2D>
  eyeLeft:      { scaleX: number; scaleY: number }
  eyeRight:     { scaleX: number; scaleY: number }
  eyebrowLeft:  Required<Transform2D>
  eyebrowRight: Required<Transform2D>
  legLeft:      Required<Transform2D>
  legRight:     Required<Transform2D>
  nose:         { scaleX: number; scaleY: number }
  blush:  number
  tears:  number

  // ─── Offsets (loops cíclicos + jump) ───────────────────────
  bodyBreatheY:   number
  bodyJumpY:      number
  eyeLeftBlinkY:  number
  eyeRightBlinkY: number
  armLeftSwayR:   number
  armRightSwayR:  number
  armLeftBobY:    number
  armRightBobY:   number
  pupilSparkle:   number
  mouthGrinScale: number
  legLeftJumpR:   number
  legRightJumpR:  number
  legLeftJumpY:   number
  legRightJumpY:  number
}

export interface TransitionHandles {
  armLeft:      Anim | null
  armRight:     Anim | null
  eyeLeft:      Anim | null
  eyeRight:     Anim | null
  eyebrowLeft:  Anim | null
  eyebrowRight: Anim | null
  legLeft:      Anim | null
  legRight:     Anim | null
  nose:         Anim | null
  scalars:      Anim | null
}

export function createTransitionHandles(): TransitionHandles {
  return {
    armLeft: null, armRight: null,
    eyeLeft: null, eyeRight: null,
    eyebrowLeft: null, eyebrowRight: null,
    legLeft: null, legRight: null,
    nose: null, scalars: null,
  }
}

const fullTransform = (t: Transform2D): Required<Transform2D> => ({
  rotate:     t.rotate     ?? 0,
  translateX: t.translateX ?? 0,
  translateY: t.translateY ?? 0,
  scaleX:     t.scaleX     ?? 1,
  scaleY:     t.scaleY     ?? 1,
})

export function targetFromMode(mode: ModeConfig): Pick<AnimState,
  | 'armLeft' | 'armRight' | 'eyeLeft' | 'eyeRight'
  | 'eyebrowLeft' | 'eyebrowRight' | 'legLeft' | 'legRight'
  | 'nose' | 'blush' | 'tears'
> {
  return {
    armLeft:      fullTransform(mode.armLeft.transform),
    armRight:     fullTransform(mode.armRight.transform),
    eyeLeft:      { scaleX: mode.eyeLeft.shape.x,  scaleY: mode.eyeLeft.shape.y  },
    eyeRight:     { scaleX: mode.eyeRight.shape.x, scaleY: mode.eyeRight.shape.y },
    eyebrowLeft:  fullTransform(mode.eyebrowLeft.transform),
    eyebrowRight: fullTransform(mode.eyebrowRight.transform),
    legLeft:      fullTransform(mode.legLeft.transform),
    legRight:     fullTransform(mode.legRight.transform),
    nose:         { scaleX: mode.nose.transform.scaleX ?? 1, scaleY: mode.nose.transform.scaleY ?? 1 },
    blush:  mode.blush,
    tears:  mode.tears,
  }
}

export function createAnimState(mode: ModeConfig): AnimState {
  const base = targetFromMode(mode)
  return {
    ...base,
    bodyBreatheY:   0,
    bodyJumpY:      0,
    eyeLeftBlinkY:  1,
    eyeRightBlinkY: 1,
    armLeftSwayR:   0,
    armRightSwayR:  0,
    armLeftBobY:    0,
    armRightBobY:   0,
    pupilSparkle:   1,
    mouthGrinScale: 1,
    legLeftJumpR:   0,
    legRightJumpR:  0,
    legLeftJumpY:   0,
    legRightJumpY:  0,
  }
}

export interface TransitionOptions {
  durationMs?: number
  ease?: string
}

function cancel(h: Anim | null) {
  if (h) try { h.cancel() } catch { /* já cancelada */ }
}

export function transitionTo(
  state: AnimState,
  handles: TransitionHandles,
  target: ReturnType<typeof targetFromMode>,
  opts: TransitionOptions = {},
) {
  const duration = opts.durationMs ?? 400
  const ease = opts.ease ?? 'outQuad'

  const groups: Array<[keyof TransitionHandles, Record<string, number>, Record<string, number>]> = [
    ['armLeft',      state.armLeft,      target.armLeft],
    ['armRight',     state.armRight,     target.armRight],
    ['eyeLeft',      state.eyeLeft,      target.eyeLeft],
    ['eyeRight',     state.eyeRight,     target.eyeRight],
    ['eyebrowLeft',  state.eyebrowLeft,  target.eyebrowLeft],
    ['eyebrowRight', state.eyebrowRight, target.eyebrowRight],
    ['legLeft',      state.legLeft,      target.legLeft],
    ['legRight',     state.legRight,     target.legRight],
    ['nose',         state.nose,         target.nose],
  ]

  for (const [key, obj, goal] of groups) {
    cancel(handles[key])
    handles[key] = animate(obj, { ...goal, duration, ease })
  }

  cancel(handles.scalars)
  handles.scalars = animate(state, {
    blush: target.blush,
    tears: target.tears,
    duration,
    ease,
  })
}
