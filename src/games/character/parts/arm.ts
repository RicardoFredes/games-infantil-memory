import type { ArmBindings, ArmSpec, Transform2D } from '../types'
import { armLeftAnims, armRightAnims, type ArmLeftAnimName, type ArmRightAnimName } from '@/config/character/animations'
import { armLeftPoses, armRightPoses, type ArmLeftPoseName, type ArmRightPoseName } from '@/config/character/poses'
import { mergeTransform, toTransformAttr } from './transform'

export interface ArmOverlay {
  transform?: Transform2D
}

export function resolveArmLeft(spec: ArmSpec, overlay?: ArmOverlay): ArmBindings {
  const pose = armLeftPoses[spec.pose as ArmLeftPoseName] ?? armLeftPoses.down
  const animClass = spec.anim ? (armLeftAnims[spec.anim as ArmLeftAnimName] ?? '') : ''
  return {
    strokePath: pose.stroke,
    handPath:   pose.hand,
    transformAttr: toTransformAttr(mergeTransform(spec.transform, overlay?.transform)),
    animClass,
  }
}

export function resolveArmRight(spec: ArmSpec, overlay?: ArmOverlay): ArmBindings {
  const pose = armRightPoses[spec.pose as ArmRightPoseName] ?? armRightPoses.down
  const animClass = spec.anim ? (armRightAnims[spec.anim as ArmRightAnimName] ?? '') : ''
  return {
    strokePath: pose.stroke,
    handPath:   pose.hand,
    transformAttr: toTransformAttr(mergeTransform(spec.transform, overlay?.transform)),
    animClass,
  }
}
