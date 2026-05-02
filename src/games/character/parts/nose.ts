import type { NoseBindings } from '../types'
import { toTransformAttr } from './transform'

export function resolveNose(animatedScale: { scaleX: number; scaleY: number }): NoseBindings {
  return { transformAttr: toTransformAttr({ scaleX: animatedScale.scaleX, scaleY: animatedScale.scaleY }) }
}
