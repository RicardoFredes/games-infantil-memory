import type { LegBindings, Transform2D } from '../types'
import { toTransformAttr } from './transform'

export function resolveLeg(animatedTransform: Transform2D): LegBindings {
  return { transformAttr: toTransformAttr(animatedTransform) }
}
