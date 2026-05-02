import type { ArmBindings, ArmSpec, Transform2D } from '../types'
import { armLeftPoses, armRightPoses, type ArmLeftPoseName, type ArmRightPoseName } from '@/config/character/poses'
import { mergeTransform, toTransformAttr } from './transform'

export interface ArmOverlay {
  transform?: Transform2D
}

export function resolveArmLeft(spec: ArmSpec, animatedTransform: Transform2D, overlay?: ArmOverlay): ArmBindings {
  const pose = armLeftPoses[spec.pose as ArmLeftPoseName] ?? armLeftPoses.down
  return {
    strokePath: pose.stroke,
    handPath:   pose.hand,
    transformAttr: toTransformAttr(mergeTransform(animatedTransform, overlay?.transform)),
  }
}

export function resolveArmRight(spec: ArmSpec, animatedTransform: Transform2D, overlay?: ArmOverlay): ArmBindings {
  const pose = armRightPoses[spec.pose as ArmRightPoseName] ?? armRightPoses.down
  return {
    strokePath: pose.stroke,
    handPath:   pose.hand,
    transformAttr: toTransformAttr(mergeTransform(animatedTransform, overlay?.transform)),
  }
}
