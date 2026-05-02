import type { EyeBindings, EyeSpec } from '../types'
import { eyeAnims, type EyeAnimName } from '@/config/character/animations'

export interface EyeOverlay {
  /** se true, força olho fechado (wink/eyes-closed/sleeping) */
  forceClosed?: boolean
}

export function resolveEye(
  spec: EyeSpec,
  animatedShape: { scaleX: number; scaleY: number },
  overlay?: EyeOverlay,
): EyeBindings {
  const closed = !!overlay?.forceClosed
  const closedOpacity = closed ? 1 : 0
  const openOpacity   = 1 - closedOpacity
  const shapeTransform = `scale(${animatedShape.scaleX}, ${animatedShape.scaleY})`
  const blinkClass = spec.blinkAnim ? eyeAnims.blink : ''
  const pupilClass = spec.pupilAnim ? (eyeAnims[spec.pupilAnim as EyeAnimName] ?? '') : ''
  return { closedOpacity, openOpacity, shapeTransform, blinkClass, pupilClass }
}
