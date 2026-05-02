import type { LegBindings, LegSpec } from '../types'
import { toTransformAttr } from './transform'

export function resolveLeg(spec: LegSpec): LegBindings {
  return { transformAttr: toTransformAttr(spec.transform) }
}
