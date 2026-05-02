import type { EyebrowBindings, EyebrowSpec } from '../types'
import { leftEyebrowPaths, rightEyebrowPaths, type EyebrowPoseName } from '@/config/character/poses'
import { toTransformAttr } from './transform'

export function resolveEyebrowLeft(spec: EyebrowSpec): EyebrowBindings {
  return {
    pathD: leftEyebrowPaths[spec.pose as EyebrowPoseName] ?? leftEyebrowPaths.default,
    transformAttr: toTransformAttr(spec.transform),
  }
}

export function resolveEyebrowRight(spec: EyebrowSpec): EyebrowBindings {
  return {
    pathD: rightEyebrowPaths[spec.pose as EyebrowPoseName] ?? rightEyebrowPaths.default,
    transformAttr: toTransformAttr(spec.transform),
  }
}
