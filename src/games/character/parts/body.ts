import type { BodyBindings } from '../types'
import { toTransformAttr } from './transform'

const BELLY_ANCHOR_X = 130
const BELLY_ANCHOR_Y = 213

export function resolveBody(translateY: number, bellyScale = 1): BodyBindings {
  if (bellyScale === 1) {
    return { transformAttr: toTransformAttr({ translateY }) }
  }
  const t = `translate(0, ${translateY}) translate(${BELLY_ANCHOR_X}, ${BELLY_ANCHOR_Y}) scale(${bellyScale}) translate(${-BELLY_ANCHOR_X}, ${-BELLY_ANCHOR_Y})`
  return { transformAttr: t }
}
