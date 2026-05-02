import type { NoseBindings, NoseSpec } from '../types'
import { toTransformAttr } from './transform'

export function resolveNose(spec: NoseSpec): NoseBindings {
  return { transformAttr: toTransformAttr(spec.transform) }
}
