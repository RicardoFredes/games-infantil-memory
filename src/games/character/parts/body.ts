import type { BodyBindings, BodySpec } from '../types'
import { bodyAnims, type BodyAnimName } from '@/config/character/animations'

export interface BodyOverlay {
  /** sobrescreve anim do mode (ex.: jump-once, spin-once) */
  anim?: string | null
}

export function resolveBody(spec: BodySpec, overlay?: BodyOverlay): BodyBindings {
  const breathClass = spec.breathe ? bodyAnims.breathe : ''
  const animKey = overlay?.anim ?? spec.anim
  const bodyAnimClass = animKey ? (bodyAnims[animKey as BodyAnimName] ?? '') : ''
  return { breathClass, bodyAnimClass }
}
