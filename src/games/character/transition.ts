// Sistema de transição suave entre modos.
// Cada parte expõe valores numéricos interpoláveis via anime.js.
// Paths SVG (que mudam abruptamente) são suavizados por cross-fade
// de opacidade entre camadas pré-renderizadas.

import { animate, utils } from 'animejs'
import type { ModeConfig, Transform2D } from './types'
import { armLeftPoses, armRightPoses } from '@/config/character/poses'

const ARM_LEFT_POSE_NAMES  = Object.keys(armLeftPoses)  as Array<keyof typeof armLeftPoses>
const ARM_RIGHT_POSE_NAMES = Object.keys(armRightPoses) as Array<keyof typeof armRightPoses>
const MOUTH_POSE_NAMES = [
  'idle', 'sad', 'tired', 'excited', 'thinking', 'happy', 'surprised',
] as const

type ArmLeftPoseOpacities  = Record<keyof typeof armLeftPoses,  number>
type ArmRightPoseOpacities = Record<keyof typeof armRightPoses, number>
type MouthPoseOpacities    = Record<typeof MOUTH_POSE_NAMES[number], number>

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
  /** Opacidade por pose: cross-fade entre paths de braço esquerdo. */
  armLeftPoseOpacities:  ArmLeftPoseOpacities
  armRightPoseOpacities: ArmRightPoseOpacities
  /** Opacidade por pose: cross-fade entre paths de boca. */
  mouthPoseOpacities: MouthPoseOpacities
}

const fullTransform = (t: Transform2D): Required<Transform2D> => ({
  rotate:     t.rotate     ?? 0,
  translateX: t.translateX ?? 0,
  translateY: t.translateY ?? 0,
  scaleX:     t.scaleX     ?? 1,
  scaleY:     t.scaleY     ?? 1,
})

const onlyOne = <K extends string>(keys: readonly K[], active: K): Record<K, number> => {
  const out = {} as Record<K, number>
  for (const k of keys) out[k] = k === active ? 1 : 0
  return out
}

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
    armLeftPoseOpacities:  onlyOne(ARM_LEFT_POSE_NAMES,  mode.armLeft.pose  as keyof typeof armLeftPoses),
    armRightPoseOpacities: onlyOne(ARM_RIGHT_POSE_NAMES, mode.armRight.pose as keyof typeof armRightPoses),
    mouthPoseOpacities:    onlyOne(MOUTH_POSE_NAMES,     mode.mouth.pose    as typeof MOUTH_POSE_NAMES[number]),
  }
}

export function createAnimState(mode: ModeConfig): AnimState {
  return targetFromMode(mode)
}

export interface TransitionOptions {
  durationMs?: number
  ease?: string
}

export function transitionTo(
  state: AnimState,
  target: AnimState,
  opts: TransitionOptions = {},
) {
  const duration = opts.durationMs ?? 400
  const ease = opts.ease ?? 'outQuad'

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
    [state.armLeftPoseOpacities,  target.armLeftPoseOpacities],
    [state.armRightPoseOpacities, target.armRightPoseOpacities],
    [state.mouthPoseOpacities,    target.mouthPoseOpacities],
  ]

  for (const [obj, goal] of groups) {
    utils.remove(obj)
    animate(obj, { ...goal, duration, ease })
  }

  utils.remove(state)
  animate(state, {
    blush: target.blush,
    tears: target.tears,
    duration,
    ease,
  })
}
