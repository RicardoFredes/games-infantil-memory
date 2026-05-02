// Sistema de transição suave entre modos.
// Cada parte do corpo expõe um conjunto de valores numéricos que podem
// ser interpolados pelo anime.js. Path strings e classes CSS continuam
// trocando direto (são discretos por natureza).

import { animate, utils } from 'animejs'
import type { ModeConfig, Transform2D } from './types'

export interface AnimState {
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
}

const fullTransform = (t: Transform2D): Required<Transform2D> => ({
  rotate:     t.rotate     ?? 0,
  translateX: t.translateX ?? 0,
  translateY: t.translateY ?? 0,
  scaleX:     t.scaleX     ?? 1,
  scaleY:     t.scaleY     ?? 1,
})

/** Snapshot dos valores interpoláveis para o estado-alvo. */
export function targetFromMode(mode: ModeConfig): AnimState {
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
  return targetFromMode(mode)
}

export interface TransitionOptions {
  durationMs?: number
  ease?: string
}

/**
 * Anima `state` (objeto reativo Alpine) em direção aos valores de `target`.
 * Cancela tween anterior antes de disparar o novo.
 */
export function transitionTo(
  state: AnimState,
  target: AnimState,
  opts: TransitionOptions = {},
) {
  const duration = opts.durationMs ?? 400
  const ease = opts.ease ?? 'outQuad'

  // Anima cada sub-objeto separadamente (anime.js anima propriedades
  // de primeiro nível; aninhar exige um target por sub-grupo).
  const groups: Array<[Record<string, number>, Record<string, number>]> = [
    [state.armLeft,      target.armLeft],
    [state.armRight,     target.armRight],
    [state.eyeLeft,      target.eyeLeft],
    [state.eyeRight,     target.eyeRight],
    [state.eyebrowLeft,  target.eyebrowLeft],
    [state.eyebrowRight, target.eyebrowRight],
    [state.legLeft,      target.legLeft],
    [state.legRight,     target.legRight],
    [state.nose,         target.nose],
  ]

  for (const [obj, goal] of groups) {
    utils.remove(obj)
    animate(obj, { ...goal, duration, ease })
  }

  // Top-level scalars (blush, tears) animam o próprio AnimState.
  utils.remove(state)
  animate(state, {
    blush: target.blush,
    tears: target.tears,
    duration,
    ease,
  })
}
