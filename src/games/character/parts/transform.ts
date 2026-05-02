// Helper para serializar Transform2D em string SVG.

import type { Transform2D } from '../types'

export function toTransformAttr(t: Transform2D | undefined): string {
  if (!t) return ''
  const parts: string[] = []
  const tx = t.translateX ?? 0
  const ty = t.translateY ?? 0
  if (tx !== 0 || ty !== 0) parts.push(`translate(${tx}, ${ty})`)
  if (t.rotate !== undefined && t.rotate !== 0) parts.push(`rotate(${t.rotate})`)
  const sx = t.scaleX ?? 1
  const sy = t.scaleY ?? 1
  if (sx !== 1 || sy !== 1) parts.push(`scale(${sx}, ${sy})`)
  return parts.length ? parts.join(' ') : 'rotate(0)'
}

export function mergeTransform(base: Transform2D, overlay?: Transform2D | null): Transform2D {
  if (!overlay) return base
  return {
    rotate:     (base.rotate     ?? 0) + (overlay.rotate     ?? 0),
    translateX: (base.translateX ?? 0) + (overlay.translateX ?? 0),
    translateY: (base.translateY ?? 0) + (overlay.translateY ?? 0),
    scaleX:     (base.scaleX     ?? 1) * (overlay.scaleX     ?? 1),
    scaleY:     (base.scaleY     ?? 1) * (overlay.scaleY     ?? 1),
  }
}
