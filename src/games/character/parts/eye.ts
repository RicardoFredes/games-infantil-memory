import type { EyeBindings, EyeSpec } from '../types'

export interface EyeOverlay {
  /** se true, força olho fechado (wink/eyes-closed/sleeping) */
  forceClosed?: boolean
}

export function resolveEye(
  spec: EyeSpec,
  animatedShape: { scaleX: number; scaleY: number },
  blinkY: number,
  overlay?: EyeOverlay,
): EyeBindings {
  const closed = !!overlay?.forceClosed
  const closedOpacity = closed ? 1 : 0
  const openOpacity   = 1 - closedOpacity
  const sx = animatedShape.scaleX
  const sy = animatedShape.scaleY * blinkY
  return {
    closedOpacity,
    openOpacity,
    shapeTransform: `scale(${sx}, ${sy})`,
  }
}
