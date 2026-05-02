import type { EyebrowBindings, EyebrowSpec, Transform2D } from '../types'
import { leftEyebrowPaths, rightEyebrowPaths, type EyebrowPoseName } from '@/config/character/poses'
import { toTransformAttr } from './transform'

export function resolveEyebrowLeft(spec: EyebrowSpec, animatedTransform: Transform2D): EyebrowBindings {
  return {
    pathD: leftEyebrowPaths[spec.pose as EyebrowPoseName] ?? leftEyebrowPaths.default,
    transformAttr: toTransformAttr(animatedTransform),
  }
}

export function resolveEyebrowRight(spec: EyebrowSpec, animatedTransform: Transform2D): EyebrowBindings {
  return {
    pathD: rightEyebrowPaths[spec.pose as EyebrowPoseName] ?? rightEyebrowPaths.default,
    transformAttr: toTransformAttr(animatedTransform),
  }
}
