import type { BodyBindings } from '../types'
import { toTransformAttr } from './transform'

export function resolveBody(translateY: number): BodyBindings {
  return { transformAttr: toTransformAttr({ translateY }) }
}
